#!/bin/bash
# cache-cron-warm.sh - Automated cache warming script for cron execution
# Runs daily at 08:00 CET to warm cache with READMEs and high-value documentation

# Configuration
APEX_DIR="/mnt/c/Users/peanu/Documents/AI/Development/apex-hive"
LOG_DIR="$HOME/.apex-cache"
LOG_FILE="$LOG_DIR/cron.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log() {
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
}

# Function to log and echo (for visible output if run manually)
log_echo() {
    echo "[$TIMESTAMP] $1"
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
}

# Start logging
log_echo "Starting automated cache warming..."

# Change to Apex Hive directory
if ! cd "$APEX_DIR"; then
    log_echo "ERROR: Could not change to Apex Hive directory: $APEX_DIR"
    exit 1
fi

# Check if apex command is available
if ! command -v node &> /dev/null; then
    log_echo "ERROR: Node.js not found in PATH"
    exit 1
fi

# Check if apex-router.js exists
if [ ! -f "apex-router.js" ]; then
    log_echo "ERROR: apex-router.js not found in $APEX_DIR"
    exit 1
fi

# Run the cache warming with comprehensive logging
log_echo "Executing: node apex-router.js cache:warm-all"

# Execute the command and capture output
if OUTPUT=$(node apex-router.js cache:warm-all --verbose 2>&1); then
    log_echo "SUCCESS: Cache warming completed"
    log "Output: $OUTPUT"
    
    # Extract summary information if available
    if echo "$OUTPUT" | grep -q "Successfully cached"; then
        SUMMARY=$(echo "$OUTPUT" | grep "Successfully cached" | tail -1)
        log_echo "Summary: $SUMMARY"
    fi
    
    exit 0
else
    EXIT_CODE=$?
    log_echo "ERROR: Cache warming failed with exit code $EXIT_CODE"
    log "Error output: $OUTPUT"
    exit $EXIT_CODE
fi