#!/usr/bin/env bash

# 1) Install Python dependencies
pip install -r requirements.txt

# 2) Build React frontend
cd frontend
npm install
npm run build

# 3) Move React's build/ up one level
rm -rf ../build
mv build ../build
