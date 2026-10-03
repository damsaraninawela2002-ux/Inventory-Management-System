@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo Inventory API - Port 5000 Process Manager
echo ===================================================
echo Checking for active processes listening on port 5000...

set FOUND=0

for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr ":5000" ^| findstr "LISTENING"') do (
    set TARGET_PID=%%a
    if defined TARGET_PID (
        set PROC_NAME=
        for /f "tokens=1 delims=," %%p in ('tasklist /FI "PID eq !TARGET_PID!" /FO CSV /NH 2^>nul') do (
            set PROC_NAME=%%~p
        )
        if /i "!PROC_NAME!"=="InventoryApi.exe" (
            echo Terminating !PROC_NAME! [PID: !TARGET_PID!]
            taskkill /PID !TARGET_PID! /F
            if errorlevel 1 (
                echo Failed to stop !PROC_NAME! [PID: !TARGET_PID!].
            ) else (
                echo Stop requested for !PROC_NAME! [PID: !TARGET_PID!].
                set FOUND=1
            )
        ) else if /i "!PROC_NAME!"=="dotnet.exe" (
            echo Found dotnet.exe [PID: !TARGET_PID!]. It was not stopped automatically to avoid terminating an unrelated .NET app.
            echo Verify that this PID belongs to InventoryApi, then stop it with: taskkill /PID !TARGET_PID! /F
        ) else if defined PROC_NAME (
            echo Process "!PROC_NAME!" [PID: !TARGET_PID!] is on port 5000 but is not InventoryApi.exe or dotnet.exe.
        )
    )
)

rem Brief delay to let the socket release
ping 127.0.0.1 -n 2 >nul
set LISTENING=0
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Port 5000 is still occupied by PID %%a.
    set LISTENING=1
)

if "!LISTENING!"=="1" (
    echo Could not free port 5000. Stop the listed process manually or choose another port.
    echo ===================================================
    exit /b 1
)

if "!FOUND!"=="1" (
    echo Port 5000 is now free.
) else (
    echo Port 5000 is free. No matching process found.
)

echo ===================================================
exit /b 0
