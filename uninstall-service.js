const { Service } = require("node-windows");
const path = require("path");

const appSvc = new Service({
  name: "SecureRDP-ManagerService",
  description: "Secure Expose RDP service",
  runAsAdmin: true,
  script: path.join(__dirname, "app.js")
});

appSvc.on("stop", () => {
  console.log("Windows服务已停止");
});
appSvc.on("uninstall", () => {
  console.log("Windows服务已卸载");
});

if(appSvc.exists) {
  appSvc.uninstall();
} else {
  console.log("服务不存在")
}