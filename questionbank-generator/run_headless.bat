@echo off
title MDCAT MCQ Generator - Headless Mode
cd /d "%~dp0"

echo ============================================
echo   MDCAT MCQ Generator - Headless Mode
echo   (No browser - no WebSocket errors)
echo ============================================
echo.
echo This runs the generator directly WITHOUT Streamlit,
echo so you get clean terminal output and no
echo "WebSocketClosedError" spam.
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found in PATH.
    pause
    exit /b 1
)

REM Check LM Studio is reachable before starting
echo Checking LM Studio at http://localhost:1234 ...
python -c "import requests; r=requests.get('http://localhost:1234/v1/models', timeout=5); print('  LM Studio OK:', 'online' if r.status_code==200 else 'status '+str(r.status_code))" 2>nul
if errorlevel 1 (
    echo [WARNING] LM Studio not reachable. Make sure it is running.
    echo           Continue anyway and retry.
    echo.
)

echo.
echo Processing Balochistan books (6 total)...
echo Each book takes ~1 hour. Progress saves after every page.
echo You can close this window and reopen it to resume later.
echo.

set OUTPUT=combined_mcqs.json
set YEAR=2026

echo [1/6] Balochistan 11 Biology...
python generate_mcqs.py "Books\Balochistan\Balochistan 11 Biology Quetta Board Class PDF Text Book New Edition.pdf" --subject Biology --output %OUTPUT% --year %YEAR%

echo [2/6] Balochistan 12 Biology...
python generate_mcqs.py "Books\Balochistan\Balochistan 12 Biology  Quetta Board Class  PDF Text Book New Edition.pdf" --subject Biology --output %OUTPUT% --year %YEAR%

echo [3/6] Balochistan Board Chemistry 11th...
python generate_mcqs.py "Books\Balochistan\Balochistan Board Chemistry Class11th PDF Book.pdf" --subject Chemistry --output %OUTPUT% --year %YEAR%

echo [4/6] Balochistan Board Chemistry 12th...
python generate_mcqs.py "Books\Balochistan\Balochistan Board Chemistry Class12th PDF Book.pdf" --subject Chemistry --output %OUTPUT% --year %YEAR%

echo [5/6] Balochistan 11 Physics...
python generate_mcqs.py "Books\Balochistan\Balochistan 11 Physics  Quetta Board Class  PDF Text Book New Edition.pdf" --subject Physics --output %OUTPUT% --year %YEAR%

echo [6/6] Balochistan 12 Physics...
python generate_mcqs.py "Books\Balochistan\Balochistan 12 Physics Quetta Board Class  PDF Text Book New Edition.pdf" --subject Physics --output %OUTPUT% --year %YEAR%

echo.
echo ============================================
echo   All Balochistan books done!
echo   MCQs saved to generated_mcqs\combined_mcqs.json
echo ============================================
echo.
echo Next steps:
echo   1. In the Streamlit app, open "Update question bank"
echo      and click Update to rebuild FINAL_QUESTION_BANK.json
echo   2. Then run the sync pipeline for the student app.
echo.
pause
