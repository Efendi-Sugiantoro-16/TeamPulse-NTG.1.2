@echo off
echo Starting TeamPulse Emotion Input System...
echo.
echo This will start a local web server for the emotion input application.
echo Make sure you have Python installed on your system.
echo.
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

python -m http.server 8000

pause 