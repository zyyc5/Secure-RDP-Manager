# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY src/ ./src/
COPY public/ ./public/
COPY frpc/ ./frpc/
COPY config/ ./config/

# 创建必要的目录
RUN mkdir -p /app/config /app/log

# 复制配置文件
COPY config/ ./config/

# 设置环境变量
ENV NODE_ENV=production
ENV CONFIG_DIR=/app/config

# 暴露端口
EXPOSE 9108 13389

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 确保production.json存在（如果不存在则复制default.json）
RUN if [ ! -f /app/config/production.json ]; then cp /app/config/default.json /app/config/production.json; fi

# 更改文件所有权并设置正确的权限
RUN chown -R nodejs:nodejs /app
RUN chmod -R 755 /app
RUN chmod -R 664 /app/config/*.json
RUN chmod 775 /app/config

# 复制entrypoint脚本
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# 使用entrypoint脚本
ENTRYPOINT ["/app/docker-entrypoint.sh"] 