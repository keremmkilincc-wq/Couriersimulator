@echo off
REM Courier Simulator - Windows Portable Launcher
REM Gercek Electron EXE derlenene kadar: oyunu varsayilan tarayicida tam ekran acar.
set "HERE=%~dp0"
set "PAGE=%HERE%index.html"
echo Courier Simulator aciliyor...
where chrome >nul 2>nul
if %errorlevel%==0 (
  start "" chrome --app="file:///%PAGE:\=/%" --user-data-dir="%HERE%.chrome-profile"
  goto :end
)
where msedge >nul 2>nul
if %errorlevel%==0 (
  start "" msedge --app="file:///%PAGE:\=/%" --user-data-dir="%HERE%.edge-profile"
  goto :end
)
start "" "%PAGE%"
:end
