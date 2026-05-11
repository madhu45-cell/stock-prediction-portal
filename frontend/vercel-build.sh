#!/bin/bash
# vercel-build.sh

echo "Installing dependencies..."
cd frontend
npm install --legacy-peer-deps

echo "Building project..."
npm run build

echo "Build complete!"