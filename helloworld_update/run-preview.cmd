@echo off
REM Starts a local web server from the PROJECT ROOT so that:
REM   - the preview loads webui_patch/rpc-stubs.js, and
REM   - the @font-face brand font (under extracted/...) resolves.
REM Then open the printed URL in your browser. Ctrl+C to stop.

cd /d "%~dp0.."
echo Serving project root: %cd%
echo.
echo Open this URL in your browser:
echo     http://127.0.0.1:8731/helloworld_update/preview/index.html
echo.
python -m http.server 8731 --bind 127.0.0.1
