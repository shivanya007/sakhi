@echo off
echo Starting Women's Safety Project...

:: Start the FastAPI Backend using Absolute Path
start cmd /k "cd /d C:\Users\HP\sakhi\Backend && python -m uvicorn main:app --reload"

:: Start the React Frontend using Absolute Path
start cmd /k "cd /d C:\Users\HP\sakhi\safety-frontend && npm start"

echo Services are launching. You can minimize this window.
pause