#!/bin/bash

echo "📦 Building Firefox extension..."
echo "📋 Creating Firefox package..."

# Clean up any previous build
rm -f ../tokime-firefox.zip

# Create zip file excluding development files
mkdir firefox-build
cp -r * firefox-build/
cp manifest-firefox.json firefox-build/manifest.json

cd firefox-build && zip -r ../../tokime-firefox.zip . -x "*.DS_Store" -x ".git/*" -x "build_firefox.sh" -x "build_chrome.sh" -x "*.log" && cd ..

rm -rf firefox-build

echo "✅ Firefox extension built successfully at ../tokime-firefox.zip"
echo "ℹ️ You can now install it in Firefox via about:debugging or submit to AMO"