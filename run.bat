@echo off
title Duangdee Server

:: Start Node Server API and Create Log of Node Server API 
echo Starting Node Server API...
echo %date% %time% > NodeServerAPI.log
start /b node server.js >> NodeServerAPI.log 2>&1
echo Node.js server started. Log saved to NodeServerAPI.log

:: Start Python API and Create Log of Python API
echo Starting Python API...
cd ./palmprint-api-python
echo %date% %time% > PythonAPI.log
start /b python server.py >> PythonAPI.log 2>&1
echo Python API started. Log saved to PythonAPI.log

:: Wait for key press
pause

:: Stop Node.js API
echo Stopping Node.js server...
taskkill /f /im node.exe

:: Stop Python API
echo Stopping Python server...
taskkill /f /im python.exe

echo All APIs have been stopped.
