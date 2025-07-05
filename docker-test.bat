@echo off
chcp 65001 >nul

echo === Secure RDP Manager Docker 构建测试 ===

REM 检查Docker是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未安装，请先安装Docker
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose未安装，请先安装Docker Compose
    pause
    exit /b 1
)

echo ✅ Docker环境检查通过

REM 检查必要文件
echo 检查必要文件...
if not exist "Dockerfile" (
    echo ❌ Dockerfile不存在
    pause
    exit /b 1
)

if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml不存在
    pause
    exit /b 1
)

if not exist "config" (
    echo ❌ config目录不存在
    pause
    exit /b 1
)

if not exist "src" (
    echo ❌ src目录不存在
    pause
    exit /b 1
)

if not exist "public" (
    echo ❌ public目录不存在
    pause
    exit /b 1
)

if not exist "frpc" (
    echo ❌ frpc目录不存在
    pause
    exit /b 1
)

echo ✅ 必要文件检查通过

REM 构建镜像
echo 构建Docker镜像...
docker build -t secure-frp-proxy:test .

if %errorlevel% neq 0 (
    echo ❌ Docker镜像构建失败
    pause
    exit /b 1
)

echo ✅ Docker镜像构建成功

REM 测试容器运行
echo 测试容器运行...
docker run -d --name test-secure-rdp -p 9109:9108 -p 13390:13389 -v %cd%/config:/app/config -v %cd%/frpc:/app/frpc -v %cd%/log:/app/log secure-frp-proxy:test

REM 等待容器启动
timeout /t 10 /nobreak >nul

REM 检查容器状态
docker ps | findstr test-secure-rdp >nul
if %errorlevel% equ 0 (
    echo ✅ 容器启动成功
    
    REM 测试API
    echo 测试API连接...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:9109/api/page-data' -Headers @{Authorization='Basic YWRtaW46cGFzc3dvcmQxMjM='} -UseBasicParsing; if ($response.StatusCode -eq 200) { Write-Host '✅ API测试通过' } else { Write-Host '❌ API测试失败，状态码: ' $response.StatusCode } } catch { Write-Host '❌ API测试失败: ' $_.Exception.Message }"
) else (
    echo ❌ 容器启动失败
    docker logs test-secure-rdp
)

REM 清理测试容器
echo 清理测试容器...
docker stop test-secure-rdp
docker rm test-secure-rdp

echo === Docker构建测试完成 ===
pause 