#!/bin/bash

echo "📦 Building Chrome extension..."

# Create zip file for Chrome
zip -r ../tokime-chrome.zip . -x "*.DS_Store" -x ".git/*"

echo "✅ Chrome extension built successfully!"