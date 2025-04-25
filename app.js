const express = require("express");
const fs = require("fs");
const path = require("path");
const rdpManager = require("./rdp-manager");
const frpc = require("./frpc-manager");
const { basicAuth, changePassword, getUserName } = require("./auth");
const app = express();
const port = require("./config").PORT;
const rdpWarp = require("./rdp-warp");

app.use(express.json())
app.use(basicAuth)

const htmlTemplate = fs.readFileSync(
  path.join(__dirname, "views", "index.html"),
  "utf8"
);

const getIp = req => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  return ip.replace("::ffff:", "");
};

app.get("/", async (req, res) => {
  const [appStatus, isFrpcInstalled, proxyStatus] = await Promise.all([
    rdpManager.getRDPStatus(),
    frpc.isInstalled(),
    frpc.isProxyCommented("remote2company"),
  ]);

  const html = htmlTemplate
    .replace("{{rdpStatus}}", appStatus ? "已启用" : "已关闭")
    .replace("{{rdpEnableDisabled}}", appStatus ? "disabled" : "")
    .replace("{{rdpDisableDisabled}}", appStatus ? "" : "disabled")
    .replace(
      "{{proxyStatus}}",
      isFrpcInstalled ? (proxyStatus ? "关闭" : "开启") : "未安装"
    )
    .replace(
      "{{proxyOpenDisabled}}",
      !isFrpcInstalled || !proxyStatus ? "disabled" : ""
    )
    .replace(
      "{{proxyCloseDisabled}}",
      isFrpcInstalled && !proxyStatus ? "" : "disabled"
    )
    .replace(
      "{{userName}}",
      getUserName() || "未登录"
    )
    .replace(
      "{{IP}}",
      getIp(req) || "0.0.0.0"
    )

  res.send(html);
});

app.post("/enable", (req, res) => {
  rdpManager.enableRDP();
  rdpManager.reSet();
  res.redirect("/");
});

app.post("/disable", (req, res) => {
  rdpManager.disableRDP();
  res.redirect("/");
});

app.post("/openproxy", async (req, res) => {
  frpc.toggleProxyComment("remote2", false);
  res.send(
    '<script>setTimeout(function(){window.location.href="/";},3000);</script>'
  );
  frpc.reStart();
});

app.post("/closeproxy", async (req, res) => {
  frpc.toggleProxyComment("remote2", true);
  res.send(
    '<script>setTimeout(function(){window.location.href="/";},3000);</script>'
  );
  frpc.reStart();
});

app.post("/change-password", (req, res) => {
  const { userName, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).send("两次输入的密码不一致！");
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).send("密码长度必须至少6位！");
  }

  changePassword({ userName, password: newPassword });
  res.send("密码修改成功，请使用新密码重新登录！");
});

app.listen(port, async() => {
  if(await frpc.isInstalled()) {
    frpc.start();
  } else {
    console.warn("frpc 未安装，无法暴露rdp到公网, 只能局域网连接, 请先安装和配置frpc");
  }
  rdpManager.startMonitor();
  rdpWarp.start()
  console.log(`Web服务运行在 http://localhost:${port}`);
});

process.on("exit", () => {
  frpc.stop();
  console.log("主进程退出，清理 frpc 进程");
});
