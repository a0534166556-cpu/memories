#!/bin/bash

echo "========================================"
echo "Setup Local MySQL Database"
echo "========================================"
echo ""
echo "This script will help you set up MySQL locally"
echo ""
echo "Make sure MySQL is installed and running!"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "Step 1: Creating .env file..."
if [ ! -f .env ]; then
    if [ -f env.example.txt ]; then
        cp env.example.txt .env
        echo "✅ Created .env file from env.example.txt"
    else
        echo "⚠️  env.example.txt not found, please create .env manually"
    fi
else
    echo "⚠️  .env file already exists, skipping..."
fi

echo ""
echo "Step 2: Installing dependencies..."
npm install

echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Make sure MySQL is running"
echo "2. Create database: CREATE DATABASE memorial;"
echo "3. Edit .env file with your MySQL settings"
echo "4. Run: npm run dev"
echo ""
echo "See SETUP_LOCAL_MYSQL.md for detailed instructions"
echo ""
