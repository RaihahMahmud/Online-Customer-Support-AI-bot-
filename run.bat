@echo off
echo Starting AI Agent...
echo.

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Starting server...
uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000

pause