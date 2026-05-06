#!/bin/bash
# iPartStore Fix — DB Server + Tunnel + Auto Vercel Deploy
# Usage: bash db-server/start.sh

cd "$(dirname "$0")/.."

source .env 2>/dev/null || true
export DB_API_KEY="${DB_API_KEY:-mormac-artron-2026}"
export DB_PORT="${DB_PORT:-4100}"

echo "=== iPartStore Fix — Starting ==="

# Kill old processes
lsof -ti:$DB_PORT 2>/dev/null | xargs kill -9 2>/dev/null
pkill -f 'cloudflared tunnel' 2>/dev/null
sleep 1

# Start Ollama if needed
if ! curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "[1/4] Starting Ollama..."
  ollama serve >/tmp/mormac-ollama.log 2>&1 &
  OLLAMA_PID=$!
  sleep 2
else
  echo "[1/4] Ollama already running"
fi

# Start DB server
echo "[2/4] Starting DB server on :$DB_PORT"
bun db-server/index.ts &
DB_PID=$!
sleep 2

if ! curl -fsS -H "x-api-key: $DB_API_KEY" "http://localhost:$DB_PORT/health" >/dev/null; then
  echo "ERROR: DB server health check failed"
  kill "$DB_PID" "${OLLAMA_PID:-}" 2>/dev/null || true
  exit 1
fi
echo "    DB server OK"

# Start Cloudflare Tunnel
echo "[3/4] Starting Cloudflare Tunnel..."
rm -f /tmp/mormac-tunnel.log
~/bin/cloudflared tunnel --url http://localhost:$DB_PORT --no-autoupdate 2>&1 | tee /tmp/mormac-tunnel.log &
TUNNEL_PID=$!

for _ in {1..20}; do
  TUNNEL_URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' /tmp/mormac-tunnel.log 2>/dev/null | tail -1)
  [ -n "$TUNNEL_URL" ] && break
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  echo "ERROR: Tunnel URL not detected"
  kill "$DB_PID" "$TUNNEL_PID" "${OLLAMA_PID:-}" 2>/dev/null || true
  exit 1
fi
echo "    Tunnel: $TUNNEL_URL"

# Auto update Vercel
echo "[4/4] Updating Vercel..."
CURRENT_URL=$(vercel env ls production 2>&1 | grep -A1 DB_API_URL | tail -1 | tr -d ' ' 2>/dev/null)

vercel env rm DB_API_URL production --yes >/dev/null 2>&1
echo "$TUNNEL_URL" | vercel env add DB_API_URL production >/dev/null 2>&1
vercel --prod --yes >/dev/null 2>&1 &
DEPLOY_PID=$!

# Update alias after deploy
(wait $DEPLOY_PID 2>/dev/null && vercel alias set $(vercel ls 2>&1 | grep -o 'mormac-[^ ]*\.vercel\.app' | head -1) dmc-notebook.vercel.app >/dev/null 2>&1 && echo "    Deploy + alias done") &

echo ""
echo "==========================================="
echo "  DB Server : http://localhost:$DB_PORT"
echo "  Tunnel    : $TUNNEL_URL"
echo "  Website   : https://dmc-notebook.vercel.app"
echo "==========================================="
echo "  Vercel deploying in background..."
echo "  Press Ctrl+C to stop all"
echo ""

trap "kill $DB_PID $TUNNEL_PID $DEPLOY_PID ${OLLAMA_PID:-} 2>/dev/null; echo 'Stopped.'" EXIT
wait $DB_PID
