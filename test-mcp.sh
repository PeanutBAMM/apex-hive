#!/bin/bash
# test-mcp.sh - Test MCP registration and functionality

echo "🧪 Apex Hive MCP Integration Test"
echo "================================="
echo ""

# Test 1: Stdout pollution check
echo "1️⃣ Testing stdout pollution..."
STDOUT_BYTES=$(timeout 2s node mcp-server.js 2>/dev/null | wc -c)
if [ "$STDOUT_BYTES" -eq 0 ]; then
    echo "✅ PASS: 0 bytes stdout pollution"
else
    echo "❌ FAIL: $STDOUT_BYTES bytes on stdout (should be 0)"
    exit 1
fi
echo ""

# Test 2: MCP server startup
echo "2️⃣ Testing MCP server startup..."
timeout 2s node mcp-server.js 2>&1 | grep -q "\[MCP\] Apex Hive Gateway started" && echo "✅ PASS: Server starts correctly" || echo "❌ FAIL: Server startup failed"
echo ""

# Test 3: Basic command execution
echo "3️⃣ Testing basic command execution..."
node index.js help > /dev/null 2>&1 && echo "✅ PASS: Help command works" || echo "❌ FAIL: Help command failed"
echo ""

# Test 4: Natural language
echo "4️⃣ Testing natural language support..."
OUTPUT=$(node index.js "zoek naar test" 2>/dev/null | grep -c "matches")
if [ "$OUTPUT" -gt 0 ]; then
    echo "✅ PASS: Dutch NL recognized"
else
    echo "❌ FAIL: Dutch NL not working"
fi
echo ""

# Test 5: Error handling
echo "5️⃣ Testing error handling..."
OUTPUT=$(node index.js "nonexistent-command" 2>&1)
if [[ "$OUTPUT" == *"Unknown command"* ]]; then
    echo "✅ PASS: Proper error handling"
else
    echo "❌ FAIL: Error handling issue"
fi
echo ""

# Test 6: Module loading
echo "6️⃣ Testing module loading..."
node -e "import('./modules/unified-cache.js').then(() => console.log('✅ PASS: Modules load correctly')).catch(() => console.log('❌ FAIL: Module loading failed'))"
echo ""

echo "================================="
echo "📝 Test Summary"
echo ""
echo "To register with Claude:"
echo "claude mcp add apex-hive -s user \"node $(pwd)/mcp-server.js\""
echo ""
echo "Current directory: $(pwd)"