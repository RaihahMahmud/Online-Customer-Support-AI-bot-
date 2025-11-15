@echo off
echo Setting up AI Agent Project...
echo.

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing requirements...
pip install -r requirements.txt

echo Setup complete!
echo.
echo To activate the virtual environment, run:
echo venv\Scripts\activate.bat
pause