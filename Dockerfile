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

# 更改文件所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 启动应用
CMD ["npm", "start"] 