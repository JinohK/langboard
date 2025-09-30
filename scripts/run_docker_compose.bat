@echo off
chcp 65001 >nul
setlocal

where docker >nul 2>&1
if %errorlevel% equ 0 ( set IS_DOCKER_INSTALLED=1 ) else ( set IS_DOCKER_INSTALLED=0 )
if %IS_DOCKER_INSTALLED% equ 0 (
    echo Docker is not installed or not found in PATH. Please install Docker to proceed.
    echo You can download it from https://docs.docker.com/desktop/setup/install/windows-install/
    pause
    exit /b 1
)

set COMPOSE_PREFIX=.\docker\docker-compose
set COMPOSE_ARGS=-f %COMPOSE_PREFIX%.kafka.yaml -f %COMPOSE_PREFIX%.pg.yaml -f %COMPOSE_PREFIX%.redis.yaml -f %COMPOSE_PREFIX%.server.yaml --env-file .\.env
set DOCS_COMPOSE_ARGS=-f %COMPOSE_PREFIX%.docs.yaml
set UI_WATCHER_COMPOSE_ARGS=-f %COMPOSE_PREFIX%.ui-watcher.yaml
set OLLAMA_SHARED_COMPOSE_ARGS=-f %COMPOSE_PREFIX%.ollama.shared.yaml
set OLLAMA_CPU_COMPOSE_ARGS=-f %COMPOSE_PREFIX%.ollama.cpu.yaml %OLLAMA_SHARED_COMPOSE_ARGS%
set OLLAMA_GPU_COMPOSE_ARGS=-f %COMPOSE_PREFIX%.ollama.gpu.yaml %OLLAMA_SHARED_COMPOSE_ARGS%

for %%A in (%*) do (
    if "%%A"=="docs" (
        set COMPOSE_ARGS=%COMPOSE_ARGS% %DOCS_COMPOSE_ARGS%
    ) else if "%%A"=="ui-watcher" (
        set COMPOSE_ARGS=%COMPOSE_ARGS% %UI_WATCHER_COMPOSE_ARGS%
    ) else if "%%A"=="ollama-cpu" (
        set COMPOSE_ARGS=%COMPOSE_ARGS% %OLLAMA_CPU_COMPOSE_ARGS%
    ) else if "%%A"=="ollama-gpu" (
        set COMPOSE_ARGS=%COMPOSE_ARGS% %OLLAMA_GPU_COMPOSE_ARGS%
    )
)

cd ..\

docker compose -f %COMPOSE_PREFIX%.prod.yaml %COMPOSE_ARGS% up -d --build

echo.
pause