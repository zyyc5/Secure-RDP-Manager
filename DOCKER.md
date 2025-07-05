# Docker 部署说明

## 快速开始

### 1. 构建并启动容器

```bash
# 构建并启动容器（后台运行）
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 2. 仅构建镜像

```bash
# 构建镜像
docker build -t secure-frp-proxy .

# 运行容器
docker run -d \
  --name secure-frp-proxy \
  -p 9108:9108 \
  -p 13389:13389 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/frpc:/app/frpc \
  -v $(pwd)/log:/app/log \
  secure-frp-proxy
```

## 配置说明

### 环境变量

可以通过环境变量覆盖配置：

```bash
docker run -d \
  --name secure-frp-proxy \
  -p 9108:9108 \
  -p 13389:13389 \
  -e PORT=8080 \
  -e USERNAME=admin \
  -e PASSWORD=your_password \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/frpc:/app/frpc \
  -v $(pwd)/log:/app/log \
  secure-frp-proxy
```

### 文件挂载

- `./config:/app/config` - 配置文件目录（包含whitelist.ini和frpc.toml）
- `./frpc:/app/frpc` - frpc可执行文件目录
- `./log:/app/log` - 日志文件目录

## 管理命令

```bash
# 停止容器
docker-compose down

# 重启容器
docker-compose restart

# 查看容器日志
docker-compose logs -f secure-frp-proxy

# 进入容器
docker exec -it secure-frp-proxy sh

# 删除容器和镜像
docker-compose down --rmi all
```

## 端口说明

- `9108` - Web管理界面端口
- `13389` - RDP代理端口

## 安全说明

- 容器以非root用户运行
- 配置文件通过挂载方式管理
- 支持环境变量配置敏感信息

## 故障排除

### 1. 端口被占用

```bash
# 检查端口占用
netstat -tulpn | grep :9108

# 修改docker-compose.yml中的端口映射
ports:
  - "8080:9108"  # 使用8080端口
```

### 2. 权限问题

```bash
# 确保挂载目录有正确权限
chmod 755 config frpc log
chmod 644 whitelist.ini
```

### 3. 配置文件问题

```bash
# 检查配置文件
docker exec -it secure-frp-proxy cat /app/config/default.json

# 重新加载配置
docker-compose restart
```

## 生产环境部署

### 1. 使用生产配置

```bash
# 设置环境变量
export NODE_ENV=production

# 启动容器
docker-compose up -d
```

### 2. 使用外部数据库（可选）

```bash
# 添加数据库服务到docker-compose.yml
services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: secure_rdp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 3. 使用反向代理

```bash
# 添加nginx服务
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - secure-frp-proxy
``` 