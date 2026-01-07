#!/bin/bash

# Initial build to create preload files
echo "🔨 Building preload files..."
npm run build

# Run dev mode
echo "🚀 Starting development server..."
npm run dev
