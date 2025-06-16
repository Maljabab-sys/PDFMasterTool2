#!/usr/bin/env bash

# 1) Install Python dependencies
pip install -r requirements.txt

# 2) Install & build React frontend
npm install
npm run build
