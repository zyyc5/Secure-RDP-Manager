#!/bin/bash

# Docker构建测试脚本

echo "=== Secure RDP Manager Docker 构建测试 ==="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 检查必要文件
echo "检查必要文件..."
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile不存在"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml不存在"
    exit 1
fi

if [ ! -d "config" ]; then
    echo "❌ config目录不存在"
    exit 1
fi

if [ ! -d "src" ]; then
    echo "❌ src目录不存在"
    exit 1
fi

if [ ! -d "public" ]; then
    echo "❌ public目录不存在"
    exit 1
fi

if [ ! -d "frpc" ]; then
    echo "❌ frpc目录不存在"
    exit 1
fi

echo "✅ 必要文件检查通过"

# 构建镜像
echo "构建Docker镜像..."
docker build -t secure-frp-proxy:test .

if [ $? -ne 0 ]; then
    echo "❌ Docker镜像构建失败"
    exit 1
fi

echo "✅ Docker镜像构建成功"

# 测试容器运行
echo "测试容器运行..."
docker run -d --name test-secure-rdp \
  -p 9109:9108 \
  -p 13390:13389 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/frpc:/app/frpc \
  -v $(pwd)/log:/app/log \
  secure-frp-proxy:test

# 等待容器启动
sleep 10

# 检查容器状态
if docker ps | grep -q test-secure-rdp; then
    echo "✅ 容器启动成功"
    
    # 测试API
    echo "测试API连接..."
    response=$(curl -s -o /dev/null -w "%{http_code}" -u admin:password123 http://localhost:9109/api/page-data)
    
    if [ "$response" = "200" ]; then
        echo "✅ API测试通过"
    else
        echo "❌ API测试失败，状态码: $response"
    fi
else
    echo "❌ 容器启动失败"
    docker logs test-secure-rdp
fi

# 清理测试容器
echo "清理测试容器..."
docker stop test-secure-rdp
docker rm test-secure-rdp

echo "=== Docker构建测试完成 ===" 