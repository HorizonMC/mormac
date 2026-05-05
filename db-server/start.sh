#!/bin/bash
# MorMac DB Server — start script
# Usage: ./db-server/start.sh

cd "$(dirname "$0")/.."

export DB_API_KEY="${DB_API_KEY:-mormac-artron-2026}"
export DB_PORT="${DB_PORT:-4100}"

echo "Starting MorMac DB Server on :$DB_PORT"

# Start DB server
bun db-server/index.ts &
DB_PID=$!

# Start Cloudflare Tunnel
echo "Starting Cloudflare Tunnel..."
~/bin/cloudflared tunnel --url http://localhost:$DB_PORT &
TUNNEL_PID=$!

sleep 5
TUNNEL_URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' /tmp/mormac-tunnel.log 2>/dev/null | tail -1)
echo ""
echo "==================================="
echo "MorMac DB Server: http://localhost:$DB_PORT"
echo "Tunnel URL: $TUNNEL_URL"
echo "==================================="
echo ""
echo "Update Vercel env if URL changed:"
echo "  vercel env rm DB_API_URL production"
echo "  echo '$TUNNEL_URL' | vercel env add DB_API_URL production"
echo "  vercel --prod --yes"

trap "kill $DB_PID $TUNNEL_PID 2>/dev/null" EXIT
wait
