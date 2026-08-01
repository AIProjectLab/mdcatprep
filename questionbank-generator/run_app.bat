@echo off
title MDCAT MCQ Generator
cd /d "%~dp0"

echo ============================================
echo   MDCAT MCQ Generator - Streamlit UI
echo ============================================
echo.
echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found in PATH.
    echo Install Python 3.11+ from python.org and check "Add to PATH".
    pause
    exit /b 1
)

echo Checking dependencies...
python -c "import streamlit, pypdfium2, requests" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    python -m pip install streamlit pypdfium2 requests
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo Starting Streamlit...
echo.
echo Open browser at: http://localhost:8501
echo (Close this window to stop the app)
echo.
streamlit run app.py

pause
