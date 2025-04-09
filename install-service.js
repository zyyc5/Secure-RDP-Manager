const { Service } = require("node-windows");
const path = require("path");
const exec = require("child_process").exec;
const PORT = require("./config").PORT;

// 创建Windows服务
const appSvc = new Service({
  name: "SecureRDP-ManagerService",
  description: "Secure Expose RDP service",
  runAsAdmin: true,
  script: path.join(__dirname, "app.js"),
});

appSvc.on("install", () => {
  appSvc.start();
  console.log("Windows服务已安装并启动");
});
appSvc.on("start", () => {
  console.log("Windows服务已启动");
  exec(`start http://127.0.0.1:${PORT}`)
});

appSvc.on("error", (err) => {
  console.error("Windows服务错误:", err);
});
appSvc.on("alreadyinstalled", () => {
  console.log("Windows服务已安装");
});
if (!appSvc.exists) {
  console.log("正在安装Windows服务...");
  appSvc.install();
} else {
  console.log("Windows服务已存在");
  exec(`start http://127.0.0.1:${PORT}`)
}


