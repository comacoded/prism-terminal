#!/usr/bin/env bash
# PRISM release: bump, build signed universal, publish the update feed,
# deploy the site, install locally.
#
#   scripts/release.sh 0.2.3 "What changed"
#
# Requires the updater signing key at ~/.tauri/prism-updater.key.
set -euo pipefail

VER="${1:?usage: release.sh <version> [notes]}"
NOTES="${2:-PRISM $VER}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEY="$HOME/.tauri/prism-updater.key"
[ -f "$KEY" ] || { echo "signing key missing: $KEY" >&2; exit 1; }

echo "── 1/5 bump versions to $VER"
python3 - "$VER" <<'PY'
import json, re, sys
v = sys.argv[1]
c = json.load(open('src-tauri/tauri.conf.json'))
c['version'] = v
json.dump(c, open('src-tauri/tauri.conf.json', 'w'), indent=2)
s = open('src-tauri/Cargo.toml').read()
s = re.sub(r'^version = "[^"]+"', f'version = "{v}"', s, count=1, flags=re.M)
open('src-tauri/Cargo.toml', 'w').write(s)
PY

echo "── 2/5 build signed universal binary"
export TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY")"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
npx tauri build --target universal-apple-darwin

BUNDLE="src-tauri/target/universal-apple-darwin/release/bundle"
DMG="$BUNDLE/dmg/PRISM_${VER}_universal.dmg"

# Notarize the DMG if credentials are set up (a keychain profile named
# "prism-notary", created once with: xcrun notarytool store-credentials).
# Direct downloads then open with no Gatekeeper warning.
if xcrun notarytool history --keychain-profile prism-notary >/dev/null 2>&1; then
  echo "── notarize + staple the DMG"
  xcrun notarytool submit "$DMG" --keychain-profile prism-notary --wait
  xcrun stapler staple "$DMG"
else
  echo "── notarization skipped (no 'prism-notary' credentials yet; DMG is signed but not notarized)"
fi

echo "── stage download DMG"
mkdir -p site/download
cp "$DMG" site/download/PRISM.dmg
cp "$DMG" "site/download/PRISM_${VER}_universal.dmg"

echo "── 3/5 stage update feed"
mkdir -p site/updates
rm -f site/updates/PRISM_*.app.tar.gz
cp "$BUNDLE/macos/PRISM.app.tar.gz" "site/updates/PRISM_${VER}.app.tar.gz"
python3 - "$VER" "$NOTES" <<'PY'
import datetime, json, sys
v, notes = sys.argv[1], sys.argv[2]
sig = open('src-tauri/target/universal-apple-darwin/release/bundle/macos/PRISM.app.tar.gz.sig').read().strip()
url = f'https://prism-landing-production.up.railway.app/updates/PRISM_{v}.app.tar.gz'
json.dump({
    'version': v,
    'notes': notes,
    'pub_date': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'platforms': {k: {'signature': sig, 'url': url} for k in ('darwin-aarch64', 'darwin-x86_64')},
}, open('site/updates/latest.json', 'w'), indent=2)
PY

echo "── 4/5 deploy feed + site"
(cd site && railway up --detach --service prism-landing)

echo "── 5/5 install locally"
osascript -e 'tell application "PRISM" to quit' >/dev/null 2>&1 || true
sleep 1
rm -rf /Applications/PRISM.app
ditto "$BUNDLE/macos/PRISM.app" /Applications/PRISM.app
open /Applications/PRISM.app

echo
echo "Released PRISM $VER"
echo "  DMG:  $BUNDLE/dmg/PRISM_${VER}_universal.dmg"
echo "  Feed: https://prism-landing-production.up.railway.app/updates/latest.json"
echo "  Running apps offer the update within 4 hours; every launch checks immediately."
echo "  Don't forget: git add -A && git commit && git push"
