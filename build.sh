#!/bin/bash
set -e

echo "Building Peergos Tax Compliance Platform..."

# Clean previous builds
rm -rf dist

# Build frontend
echo "Building frontend..."
npm run build

# Build backend (if index.ts exists)
if [ -f "server/index.ts" ]; then
  echo "Building backend..."
  npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
fi

# Copy production server
echo "Setting up production server..."
cp production-server.js dist/server.js

echo "Build completed successfully!"