#!/bin/bash
# Staple the most recent notarized DMG and redeploy. Run when Apple finishes.
set -e
cd "$(dirname "$0")/.."
VER=$(python3 -c "import json;print(json.load(open('src-tauri/tauri.conf.json'))['version'])")
DMG="src-tauri/target/universal-apple-darwin/release/bundle/dmg/PRISM_${VER}_universal.dmg"
ID=$(xcrun notarytool history --keychain-profile prism-notary | grep -m1 "id:" | awk '{print $2}')
xcrun notarytool wait "$ID" --keychain-profile prism-notary
xcrun stapler staple "$DMG" && echo "STAPLED $VER"
cp "$DMG" site/download/PRISM.dmg
cp "$DMG" "site/download/PRISM_${VER}_universal.dmg"
cd site && railway up --detach --service prism-landing
echo "REDEPLOYED NOTARIZED $VER"
