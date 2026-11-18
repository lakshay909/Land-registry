#!/usr/bin/env bash
# dev.sh - Start Land Registry full development stack with real-time logs
set -e

# Run the unified development runner
exec node scripts/dev-runner.js "$@"
