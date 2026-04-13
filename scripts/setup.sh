#!/bin/bash
set -e

echo "=== State Lessons Learned - Local Setup ==="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Error: Docker is required"; exit 1; }

NODE_VERSION=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Error: Node.js 18+ required (found v$NODE_VERSION)"
  exit 1
fi

echo "1. Starting PostgreSQL via Docker..."
docker-compose up -d db
echo "   Waiting for database..."
sleep 5

echo "2. Setting up backend..."
cd backend
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   Created backend/.env from template"
fi
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..

echo "3. Setting up frontend..."
cd frontend
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   Created frontend/.env from template"
fi
npm install
cd ..

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Start the app:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Open http://localhost:3000"
echo "Login as: admin@stateconstruction.com"
echo ""
