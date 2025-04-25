const net = require('net');
const fs = require('fs');
const config = require('./config.json');

// 配置
const LISTEN_PORT = config.LOCAL_PORT; // 中间件监听的端口（frp 客户端转发到的端口）
const RDP_HOST = '127.0.0.1'; // RDP 服务地址
const RDP_PORT = config.RDP_PORT; // RDP 服务端口
const LOG_FILE = './rdp_connections.log'; // 日志文件路径

// Proxy Protocol v2 签名
const PROXY_PROTOCOL_V2_SIGNATURE = Buffer.from([
  0x0D, 0x0A, 0x0D, 0x0A, 0x00, 0x0D, 0x0A, 0x51, 0x55, 0x49, 0x54, 0x0A
]);

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

        // 异步记录客户端真实 IP 和端口
        const logEntry = `${new Date().toISOString()} - Client IP: ${clientIP}, Port: ${clientPort}\n`;
        await fs.appendFile(LOG_FILE, logEntry, {}, ()=>{});
        console.log(logEntry);
        // clientSocket.end();

        // 跳过 Proxy Protocol 头部，获取实际 RDP 数据
        const rdpData = data.slice(16 + length);

        // 创建到 RDP 服务的连接
        const rdpSocket = net.createConnection(
          {
            host: RDP_HOST,
            port: RDP_PORT,
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
        rdpSocket.on('end', () => clientSocket.end());
        clientSocket.on('end', () => rdpSocket.end());
      } else {
        throw new Error('Invalid Proxy Protocol header');
      }
    } catch (err) {
      console.error(`Error processing data: ${err.message}`);
      clientSocket.end();
    }
  });
});



// 服务器错误处理
server.on('error', (err) => {
  console.error('Server error:', err.message);
});

// 启动服务器
const start = () => {
  server.listen(LISTEN_PORT, () => {
    console.log(`Proxy middleware listening on port ${LISTEN_PORT}`);
  });
}

const stop = () => {
  server.close(() => {
    console.log('Proxy middleware stopped');
  });
}

module.exports = {
  start,
  stop
}