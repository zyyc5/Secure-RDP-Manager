const { exec } = require("child_process");
// const os = require('os');

// // 检查是否在 Windows 系统上运行
// if (os.platform() !== 'win32') {
//     console.error('此脚本只能在 Windows 系统上运行');
//     process.exit(1);
// }

// 配置
const CHECK_INTERVAL = 60000; // 检查间隔：1分钟
const TIMEOUT = 5 * 60000; // 5分钟超时

// 存储最后一次成功登录的时间
let lastSuccessfulLogin = null;

class RDPManager {
  constructor() {
    this.isRunning = false;
  }

  // 获取远程桌面服务状态
  getRDPStatus() {
    return new Promise((resolve, reject) => {
      exec(
        'reg query "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server" /v fDenyTSConnections',
        (error, stdout, stderr) => {
          if (error) {
            console.error(`获取远程桌面服务状态失败：${error.message}`);
            resolve(false);
            return;
          }
          resolve(stdout.includes("0x0"));
        }
      );
    });
  }

  // 启用远程桌面服务
  enableRDP() {
    exec(
      'reg add "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 0 /f',
      (error, stdout, stderr) => {
        if (error) {
          console.error(`启用远程桌面服务失败：${error.message}`);
          return;
        }
        console.log("远程桌面服务已启用");
      }
    );
  }

  // 关闭远程桌面服务
  disableRDP() {
    return new Promise((resolve) => {
      exec(
        'reg add "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 1 /f',
        (error, stdout, stderr) => {
          if (error) {
            console.error(`关闭远程桌面服务失败：${error.message}`);
            resolve(false);
            return;
          }
          resolve(true);
          console.log("远程桌面服务已关闭");
        }
      );
    });
  }

  async monitor() {
    if (this.isRunning) {
      try {
        // 检查服务是否运行
        const isRunService = await this.getRDPStatus();

        if (isRunService) {

          if (lastSuccessfulLogin === null) {
            lastSuccessfulLogin = Date.now();
          }

          // 检查是否超过超时时间
          const currentTime = Date.now();
          if (currentTime - lastSuccessfulLogin > TIMEOUT) {
            console.log("超过5分钟, 关闭远程桌面服务, 不影响已经登录的用户");
            await this.disableRDP();
          }
        }
      } catch (error) {
        console.error("监控过程中发生错误:", error);
      }
    }
    setTimeout(() => {
      this.monitor();
    }, CHECK_INTERVAL);
  }

  reSet() {
    lastSuccessfulLogin = null;
  }

  startMonitor() {
    this.isRunning = true;
    this.monitor();
  }

  stopMonitor() {
    this.isRunning = false;
  }
}

module.exports = new RDPManager();
