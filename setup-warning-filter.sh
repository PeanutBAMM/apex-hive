#!/bin/bash

# Setup script voor warning filter
# Dit script configureert NODE_OPTIONS om de warning filter globally te laden

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILTER_PATH="$SCRIPT_DIR/warning-filter.js"

echo "🔧 Setting up AbortSignal warning filter..."

# Check if filter file exists
if [[ ! -f "$FILTER_PATH" ]]; then
    echo "❌ Error: warning-filter.js not found at $FILTER_PATH"
    exit 1
fi

# Add to shell profile
SHELL_CONFIG=""
if [[ -f ~/.zshrc ]]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [[ -f ~/.bashrc ]]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    echo "⚠️  Could not find ~/.zshrc or ~/.bashrc"
    echo "📝 Please manually add this to your shell config:"
    echo "export NODE_OPTIONS=\"--require $FILTER_PATH\""
    exit 0
fi

# Check if already configured
if grep -q "warning-filter.js" "$SHELL_CONFIG" 2>/dev/null; then
    echo "✅ Warning filter already configured in $SHELL_CONFIG"
else
    echo "" >> "$SHELL_CONFIG"
    echo "# Apex Hive: Suppress AbortSignal MaxListenersExceededWarning" >> "$SHELL_CONFIG"
    echo "export NODE_OPTIONS=\"--require $FILTER_PATH\"" >> "$SHELL_CONFIG"
    echo "✅ Added warning filter to $SHELL_CONFIG"
fi

echo ""
echo "🎉 Setup complete!"
echo "📋 To activate in current session: export NODE_OPTIONS=\"--require $FILTER_PATH\""
echo "🔄 Or restart your terminal"