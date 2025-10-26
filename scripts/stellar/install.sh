#!/bin/bash

# StellarWork+ Installation Script
# This script will install all dependencies and verify the setup

echo "🚀 StellarWork+ Installation Script"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "  macOS: brew install node"
    echo "  Or download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
echo ""

# Install dependencies
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    
    # Check if Stellar SDK was installed
    if [ -d "node_modules/@stellar/stellar-sdk" ]; then
        echo "✅ @stellar/stellar-sdk installed"
    else
        echo "⚠️  @stellar/stellar-sdk not found"
    fi
    
    if [ -d "node_modules/@stellar/freighter-api" ]; then
        echo "✅ @stellar/freighter-api installed"
    else
        echo "⚠️  @stellar/freighter-api not found"
    fi
    
    echo ""
    echo "🎉 Installation complete!"
    echo ""
    echo "Next steps:"
    echo "1. Install Freighter wallet: https://freighter.app"
    echo "2. Fund testnet account: https://laboratory.stellar.org/#account-creator"
    echo "3. Run: npm run dev"
    echo "4. Visit: http://localhost:3000"
    echo ""
    echo "📚 For detailed setup, see STELLAR_INTEGRATION_GUIDE.md"
    
else
    echo ""
    echo "❌ Installation failed!"
    echo ""
    echo "Please try manually:"
    echo "  npm install"
    echo ""
    exit 1
fi
