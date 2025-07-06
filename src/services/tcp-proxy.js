const net = require('net');
const fs = require('fs');
const path = require('path');
const rdpManager = require('./rdp-manager');
const configManager = require('../utils/config');

// 配置
const LOG_FILE = path.join(__dirname, '..', '..', 'log', 'proxy_connections.log'); // 日志文件路径

// 获取当前代理目标地址
const getCurrentProxyTarget = () => {
  try {
    const config = configManager.getAll();
    const currentTargetId = config.CURRENT_PROXY_TARGET || 'default';
    const target = config.PROXY_TARGETS.find(t => t.id === currentTargetId);
    
    if (target) {
      return {
        host: target.host,
        port: target.port
      };
    }
    
    // 如果没有找到目标，使用默认配置
    return {
      host: '127.0.0.1',
      port: '3389'
    };
  } catch (error) {
    console.error('获取代理目标失败:', error);
    return {
      host: '127.0.0.1',
      port: 3389
    };
  }
};

// Proxy Protocol v2 签名
const PROXY_PROTOCOL_V2_SIGNATURE = Buffer.from([
  0x0D, 0x0A, 0x0D, 0x0A, 0x00, 0x0D, 0x0A, 0x51, 0x55, 0x49, 0x54, 0x0A
]);

const logger = (log)=>{
  const logEntry = `${new Date().toLocaleString()} - ${log} \n`;
  console.log(logEntry);
  fs.appendFile(LOG_FILE, logEntry, {}, ()=>{});
}

// 创建 TCP 服务器
const server = net.createServer((clientSocket) => {
  console.log('New connection received');

  clientSocket.once('data', async (data) => {
    try {
      let clientIP = '';
      let clientPort = 0;

      // 检查 Proxy Protocol v2 签名
      if (data.slice(0, 12).equals(PROXY_PROTOCOL_V2_SIGNATURE)) {
        const familyAndProtocol = data[13];
        const length = data.readUInt16BE(14); // 头部长度

        // 处理 IPv4 或 IPv6 地址
        const addressFamily = familyAndProtocol >> 4;
        const protocol = familyAndProtocol & 0x0F;

        if (protocol !== 0x1) {
          throw new Error('Unsupported protocol (only TCP supported)');
        }

        if (addressFamily === 0x1) {
          // IPv4 (AF_INET = 0x1)
          clientIP = `${data[16]}.${data[17]}.${data[18]}.${data[19]}`;
          clientPort = data.readUInt16BE(20);
        } else if (addressFamily === 0x2) {
          // IPv6 (AF_INET6 = 0x2)
          const ipv6Bytes = data.slice(16, 32); // 16 字节 IPv6 地址
          clientIP = ipv6Bytes
            .toString('hex')
            .match(/.{1,4}/g)
            .join(':')
            .replace(/(^|:)0+/g, '$1'); // 压缩格式
          clientPort = data.readUInt16BE(32);
        } else {
          throw new Error('Unsupported address family');
        }

        // 记录客户端真实 IP
        logger(`new connent: ${clientIP}`);

        // 判断是否在白名单中, 如果不在白名单中则拒绝连接
        if(!rdpManager.isAnyWhiteList(clientIP)){
          logger(`refuse connent: ${clientIP}`);
          clientSocket.end();
          return;
        }

        logger(`rdp connent from: ${clientIP}`);

        // // 先开启RDP服务
        // await rdpManager.enableRDP();
        // rdpManager.reSet()

        // 跳过 Proxy Protocol 头部，获取实际 RDP 数据
        const rdpData = data.slice(16 + length);

        // 获取当前代理目标地址
        const targetConfig = getCurrentProxyTarget();

        // 创建到 RDP 服务的连接
        const rdpSocket = net.createConnection(
          {
            host: targetConfig.host,
            port: targetConfig.port,
          },
          () => {
            // 发送剩余的 RDP 数据
            if (rdpData.length > 0) {
              rdpSocket.write(rdpData);
            }
          }
        );

        // 双向数据转发
        clientSocket.pipe(rdpSocket);
        rdpSocket.pipe(clientSocket);

        // 错误处理
        rdpSocket.on('error', (err) => {
          console.error(`RDP socket error: ${err.message}`);
          clientSocket.end();
        });

        clientSocket.on('error', (err) => {
          console.error(`Client socket error: ${err.message}`);
          rdpSocket.end();
        });

        // 连接关闭
        rdpSocket.on('end', () => {
          clientSocket.end()
          logger('RDP connection closed');
        });
        clientSocket.on('end', () => {
          rdpSocket.end()
          logger(`connention closed: ${clientIP}`);
        });
      } else {
        logger('Invalid Proxy Protocol header');
        throw new Error('Invalid Proxy Protocol header');
      }
    } catch (err) {
      logger(`Error processing data: ${err.message}`);
      console.error(`Error processing data: ${err.message}`);
      clientSocket.end();
    }
  });
});

// 服务器错误处理
server.on('error', (err) => {
  console.error('Server error:', err.message);
  logger(`Server error: ${err.message}`);
});

// 启动服务器
const start = () => {
  const config = configManager.getAll();
  const LISTEN_PORT = config.TCP_PROXY_PORT;
  
  server.listen(LISTEN_PORT, () => {
    console.log(`RDP Proxy listening on port ${LISTEN_PORT}`);
  });
}

const stop = () => {
  server.close(() => {
    console.log('RDP Proxy stopped');
  });
}

module.exports = {
  start,
  stop
} 