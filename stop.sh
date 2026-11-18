#!/usr/bin/env bash
# stop.sh - Stop all Land Registry development services

echo "Stopping Land Registry development services..."

# 1. Kill from .dev_pids.json if present
if [ -f .dev_pids.json ]; then
  node -e "
    try {
      const pids = JSON.parse(require('fs').readFileSync('.dev_pids.json', 'utf8'));
      for (const p of pids) {
        try {
          process.kill(p.pid, 'SIGTERM');
          console.log('Stopped ' + p.name + ' (PID ' + p.pid + ')');
        } catch (e) {}
      }
    } catch(e) {}
  " 2>/dev/null || true
  rm -f .dev_pids.json
fi

# 2. Kill legacy PID files
for pidfile in dev_backend.pid dev_frontend.pid; do
  if [ -f "$pidfile" ]; then
    PID=$(cat "$pidfile")
    kill "$PID" 2>/dev/null || true
    rm -f "$pidfile"
  fi
done

# 3. Kill any remaining processes on ports 3001, 3000, 5173, 8545
PORTS=(3001 3000 5173 8545)
for PORT in "${PORTS[@]}"; do
  PIDS=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "Freeing port $PORT (PIDs: $PIDS)..."
    kill -9 $PIDS 2>/dev/null || true
  fi
done

echo "All services stopped."
