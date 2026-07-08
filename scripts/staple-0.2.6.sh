#!/bin/bash
cd /Users/nickcoma/Documents/prism-tauri-spike
DMG="src-tauri/target/universal-apple-darwin/release/bundle/dmg/PRISM_0.2.6_universal.dmg"
xcrun notarytool wait 5e06007f-721e-4024-b08a-7ed14004b3cb --keychain-profile prism-notary
xcrun stapler staple "$DMG" && echo "STAPLED OK"
cp "$DMG" site/download/PRISM.dmg
cp "$DMG" site/download/PRISM_0.2.6_universal.dmg
cd site && railway up --detach --service prism-landing
echo "REDEPLOYED NOTARIZED DMG"
