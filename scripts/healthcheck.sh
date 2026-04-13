#!/bin/bash
# Health check script for State Lessons Learned API
# Usage: ./healthcheck.sh [URL]

URL="${1:-http://localhost:4000/health}"

echo "Checking health at: $URL"

RESPONSE=$(curl -s -w "\n%{http_code}" "$URL" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "Status: HEALTHY"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  exit 0
else
  echo "Status: UNHEALTHY (HTTP $HTTP_CODE)"
  echo "$BODY"
  exit 1
fi
