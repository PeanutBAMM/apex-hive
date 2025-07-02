#!/bin/bash

echo "🏁 Performance Test Suite: Apex Cache vs Native Operations"
echo ""

# Function to measure execution time
measure_time() {
    local start=$(date +%s%N)
    "$@" >/dev/null 2>&1
    local end=$(date +%s%N)
    echo $(( (end - start) / 1000000 ))
}

# Function to get file count from output
get_file_count() {
    echo "$1" | grep -oE '"filesRead":\s*[0-9]+' | grep -oE '[0-9]+' || echo "0"
}

# Test 1: Cache Warm READMEs
echo "📊 Test 1: Cache Warm READMEs"
echo "=============================="

# Clear cache
node apex-router.js cache:clear >/dev/null 2>&1

# Run apex version (cold)
echo -n "Apex (cold cache): "
apex_cold_time=$(measure_time node apex-router.js cache:warm-readmes)
echo "${apex_cold_time}ms"

# Run apex version (warm)
echo -n "Apex (warm cache): "
apex_warm_time=$(measure_time node apex-router.js cache:warm-readmes)
echo "${apex_warm_time}ms"

# Run native version
echo -n "Native (no cache): "
native_output=$(node scripts/cache-warm-readmes-native.js 2>/dev/null)
native_time=$(echo "$native_output" | grep -oE '"totalDuration":"[0-9]+ms"' | grep -oE '[0-9]+' || echo "999")
native_files=$(echo "$native_output" | grep -oE '"filesRead":[0-9]+' | grep -oE '[0-9]+' || echo "0")
native_tokens=$(echo "$native_output" | grep -oE '"estimatedTokens":[0-9]+' | grep -oE '[0-9]+' || echo "0")
echo "${native_time}ms (${native_files} files, ~${native_tokens} tokens)"

echo ""

# Test 2: Detect Issues
echo "📊 Test 2: Detect Issues"
echo "======================="

# Clear cache
node apex-router.js cache:clear >/dev/null 2>&1

# Run apex version
echo -n "Apex (with cache): "
apex_time=$(measure_time node apex-router.js detect-issues --limit 20)
echo "${apex_time}ms"

# Run native version
echo -n "Native (no cache): "
native_output=$(node scripts/detect-issues-native.js 2>/dev/null)
native_time=$(echo "$native_output" | grep -oE '"totalDuration":"[0-9]+ms"' | grep -oE '[0-9]+' || echo "999")
native_files=$(echo "$native_output" | grep -oE '"filesRead":[0-9]+' | grep -oE '[0-9]+' || echo "0")
echo "${native_time}ms (${native_files} files read)"

echo ""

# Test 3: Quality Console Clean - THE BIG ONE
echo "📊 Test 3: Quality Console Clean (Claude Pattern)"
echo "================================================"

# Clear cache
node apex-router.js cache:clear >/dev/null 2>&1

# Run apex version
echo -n "Apex (batch ops): "
apex_time=$(measure_time node apex-router.js quality:console-clean --dry-run)
echo "${apex_time}ms"

# Run native version (simulating Claude's behavior)
echo -n "Native (Claude pattern): "
native_output=$(node scripts/quality-console-clean-native.js 2>/dev/null)
native_time=$(echo "$native_output" | grep -oE '"totalDuration":"[0-9]+ms"' | grep -oE '[0-9]+' || echo "999")
claude_patterns=$(echo "$native_output" | grep -oE '"claudePatternOccurrences":[0-9]+' | grep -oE '[0-9]+' || echo "0")
native_files=$(echo "$native_output" | grep -oE '"filesRead":[0-9]+' | grep -oE '[0-9]+' || echo "0")
native_tokens=$(echo "$native_output" | grep -oE '"estimatedTokens":[0-9]+' | grep -oE '[0-9]+' || echo "0")
echo "${native_time}ms"
echo "  ⚠️  Claude pattern (Read→Edit→Read→Edit): ${claude_patterns} occurrences"
echo "  📄 Files read: ${native_files} times (vs ${native_files} files)"
echo "  💰 Estimated tokens: ${native_tokens}"

echo ""
echo "✅ Performance tests completed!"