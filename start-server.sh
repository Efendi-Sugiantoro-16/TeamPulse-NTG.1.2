#!/bin/bash

echo "Starting TeamPulse Emotion Input System..."
echo ""
echo "This will start a local web server for the emotion input application."
echo "Make sure you have Python installed on your system."
echo ""
echo "Starting server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
else
    echo "Error: Python is not installed or not found in PATH"
    echo "Please install Python and try again"
    exit 1
fi 