@echo off
title MDCAT Genetics & DNA - MCQ Generator
cd /d "%~dp0"

echo ============================================
echo   Genetics & DNA (Inheritance) MCQ Generator
echo   Chapters 18 + 19 from PECTAA 2nd Year Biology
echo ============================================
echo.

REM Check LM Studio
python -c "import requests; r=requests.get('http://localhost:1234/v1/models', timeout=5); print('LM Studio OK' if r.status_code==200 else 'status '+str(r.status_code))" 2>nul
if errorlevel 1 (
    echo [ERROR] LM Studio is NOT running.
    echo 1. Open LM Studio
    echo 2. Load qwen2.5-vl-7b-instruct
    echo 3. Start the local server (port 1234)
    echo 4. Re-run this file
    pause
    exit /b 1
)

echo.
echo [1/2] Chapter 18: INHERITANCE (pages 83-114)
echo        Mendel's laws, dihybrid cross, blood groups,
echo        sex linkage, hemophilia, Down syndrome
echo.
python generate_mcqs.py "Books\Punjab\2871-2nd Year Biology PECTAA Text Book 2026-27 PDF-(taleem360.com).pdf" --subject Biology --output genetics_mcqs.json --start 83 --end 114 --source "PECTAA 2nd Year Biology Ch18 Inheritance" --year 2026

echo.
echo [2/2] Chapter 19: CHROMOSOME AND DNA (pages 115-154)
echo        DNA replication, transcription, translation,
echo        genetic code, mutations, sickle cell, PKU
echo.
python generate_mcqs.py "Books\Punjab\2871-2nd Year Biology PECTAA Text Book 2026-27 PDF-(taleem360.com).pdf" --subject Biology --output genetics_mcqs.json --start 115 --end 154 --source "PECTAA 2nd Year Biology Ch19 Chromosome and DNA" --year 2026

echo.
echo ============================================
echo   Done! MCQs saved to generated_mcqs\genetics_mcqs.json
echo ============================================
pause
