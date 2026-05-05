#!/bin/bash
# MorMac DB Server — start script
# Usage: ./db-server/start.sh

cd "$(dirname "$0")/.."

source "$(dirname "$0")/../.env" 2>/dev/null || true
export DB_API_KEY="${DB_API_KEY:-mormac-artron-2026}"
export DB_PORT="${DB_PORT:-4100}"

echo "Starting MorMac DB Server on :$DB_PORT"

# Start Ollama if needed
if ! curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "Starting Ollama..."
  ollama serve >/tmp/mormac-ollama.log 2>&1 &
  OLLAMA_PID=$!
  sleep 2
fi

# Start DB server
bun db-server/index.ts &
DB_PID=$!
sleep 2

if ! curl -fsS -H "x-api-key: $DB_API_KEY" "http://localhost:$DB_PORT/health" >/dev/null; then
  echo "DB server did not pass health check"
  kill "$DB_PID" "${OLLAMA_PID:-}" 2>/dev/null || true
  exit 1
fi

# Start Cloudflare Tunnel
echo "Starting Cloudflare Tunnel..."
rm -f /tmp/mormac-tunnel.log
~/bin/cloudflared tunnel --url http://localhost:$DB_PORT --no-autoupdate 2>&1 | tee /tmp/mormac-tunnel.log &
TUNNEL_PID=$!

for _ in {1..20}; do
  TUNNEL_URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' /tmp/mormac-tunnel.log 2>/dev/null | tail -1)
  [ -n "$TUNNEL_URL" ] && break
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  echo "Tunnel URL was not detected. Check /tmp/mormac-tunnel.log"
  kill "$DB_PID" "$TUNNEL_PID" "${OLLAMA_PID:-}" 2>/dev/null || true
  exit 1
fi

echo ""
echo "==================================="
echo "MorMac DB Server: http://localhost:$DB_PORT"
echo "Tunnel URL: $TUNNEL_URL"
echo "==================================="
echo ""
echo "Update Vercel env if URL changed:"
echo "  vercel env rm DB_API_URL production --yes"
echo "  echo '$TUNNEL_URL' | vercel env add DB_API_URL production"
echo "  vercel --prod --yes"

trap "kill $DB_PID $TUNNEL_PID ${OLLAMA_PID:-} 2>/dev/null" EXIT
wait
