const fs = require("fs").promises;

let config = null;

const loadConfig = async () => {
  try {
    const data = await fs.readFile("./config.json", "utf8");
    config = JSON.parse(data);
  } catch (err) {
    console.error("读取配置文件失败：", err);
  }
};

loadConfig();
// 添加基本认证中间件
const basicAuth = (req, res, next) => {

  const {
    USERNAME = "admin",
    PASSWORD = "password123",
  } = config

  // 获取请求头中的认证信息
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Restricted Area"');
    return res.status(401).send("认证失败：需要提供用户名和密码");
  }

  // 解析 Basic Auth 头
  const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString();
  const [username, password] = auth.split(":");

  // 验证用户名和密码
  if (username === USERNAME && password === PASSWORD) {
    next(); // 认证通过，继续处理请求
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Restricted Area"');
    res.status(401).send("认证失败：用户名或密码错误");
  }
};

const changePassword = async ({ userName, password }) => {
  try {
    config.USERNAME = userName;
    config.PASSWORD = password;
    await fs.writeFile("./config.json", JSON.stringify(config, null, 2));
    await loadConfig();
    return true;
  } catch (error) {
    console.log(error);
  }
  return false;
};

const getUserName = () => {
  return config.USERNAME;
};

module.exports = { basicAuth, changePassword, getUserName };
