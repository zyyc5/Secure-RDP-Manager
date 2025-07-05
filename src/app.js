const express = require('express');
const path = require('path');
const configManager = require('./utils/config');
const rdpProxy = require('./services/rdp-proxy');
const frpc = require('./services/frpc-manager');
const { basicAuth } = require('./utils/auth');

// 路由
const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');

class App {
  constructor() {
    this.app = express();
    this.server = null;
  }

  setupMiddleware() {
    // 基本认证
    this.app.use(basicAuth);
    // 静态文件服务
    this.app.use(express.static(path.join(__dirname, '..', 'public')));
    // JSON解析
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // API路由
    this.app.use('/api', apiRouter);
    // 主页路由
    this.app.use('/', indexRouter);
  }

  async startServices() {
    const config = configManager.getAll();
    // 启动RDP代理服务
    rdpProxy.start();
    console.log(`RDP代理服务已启动，监听端口: ${config.RDP_PROXY_PORT}`);
    // 启动frpc服务
    if (await frpc.isInstalled()) {
      frpc.start();
      console.log('frpc 已启动，正在运行...');
    } else {
      console.log('frpc 未安装，无法暴露rdp到公网, 只能局域网连接, 请先安装和配置frpc');
    }
  }

  async stopServices() {
    // 停止RDP代理服务
    rdpProxy.stop();
    console.log('RDP代理服务已停止');
    // 停止frpc服务
    await frpc.stop();
    console.log('frpc 已停止');
  }

  async start() {
    // 1. 启动前强制加载配置
    const env = process.env.NODE_ENV || 'default';
    await configManager.loadConfig(env);
    // 2. 初始化中间件和路由
    this.setupMiddleware();
    this.setupRoutes();
    // 3. 启动服务
    await this.startServices();
    // 4. 启动Web服务
    const config = configManager.getAll();
    const port = config.PORT || 9108;
    this.server = this.app.listen(port, () => {
      console.log(`服务器已启动，监听端口: ${port}`);
      console.log(`访问地址: http://localhost:${port}`);
    });
    // 优雅关闭
    process.on('SIGINT', async () => {
      console.log('正在关闭服务器...');
      await this.stopServices();
      if (this.server) {
        this.server.close(() => {
          console.log('服务器已关闭');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
    process.on('SIGTERM', async () => {
      console.log('正在关闭服务器...');
      await this.stopServices();
      if (this.server) {
        this.server.close(() => {
          console.log('服务器已关闭');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  }
}

// 启动应用（保证配置优先加载）
(async () => {
  const app = new App();
  try {
    await app.start();
  } catch (error) {
    console.error('启动应用失败:', error);
    process.exit(1);
  }
})();

module.exports = App; 