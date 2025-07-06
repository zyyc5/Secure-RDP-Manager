const express = require('express');
const router = express.Router();
const rdpManager = require('../services/rdp-manager');
const frpc = require('../services/frpc-manager');
const { changePassword, getUserName } = require('../utils/auth');
const configManager = require('../utils/config');

// 获取客户端IP地址
const getIp = (req) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  return ip.replace('::ffff:', '')
};

// 获取代理目标地址列表
router.get('/proxy-targets', (req, res) => {
  const config = configManager.getAll();
  if (!config) {
    return res.status(500).json({ error: '读取配置失败' });
  }
  
  res.json({
    targets: config.PROXY_TARGETS || [],
    currentTarget: config.CURRENT_PROXY_TARGET || 'default'
  });
});

// 添加代理目标地址
router.post('/proxy-targets', async (req, res) => {
  const { name, host, port, description } = req.body;
  
  if (!name || !host || !port) {
    return res.status(400).json({ error: '名称、主机地址和端口为必填项' });
  }
  
  try {
    const config = configManager.getAll();
    if (!config) {
      return res.status(500).json({ error: '读取配置失败' });
    }
    
    const newTarget = {
      id: Date.now().toString(),
      name,
      host,
      port: parseInt(port),
      description: description || ''
    };
    
    config.PROXY_TARGETS = config.PROXY_TARGETS || [];
    config.PROXY_TARGETS.push(newTarget);
    
    configManager.set('PROXY_TARGETS', config.PROXY_TARGETS);
    await configManager.saveConfig();
    
    res.json({ success: true, target: newTarget });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({ error: '保存配置失败' });
  }
});

// 删除代理目标地址
router.delete('/proxy-targets/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const config = configManager.getAll();
    if (!config) {
      return res.status(500).json({ error: '读取配置失败' });
    }
    
    config.PROXY_TARGETS = config.PROXY_TARGETS.filter(target => target.id !== id);
    
    // 如果删除的是当前目标，重置为默认目标
    if (config.CURRENT_PROXY_TARGET === id) {
      config.CURRENT_PROXY_TARGET = config.PROXY_TARGETS.length > 0 ? config.PROXY_TARGETS[0].id : 'default';
    }
    
    configManager.set('PROXY_TARGETS', config.PROXY_TARGETS);
    configManager.set('CURRENT_PROXY_TARGET', config.CURRENT_PROXY_TARGET);
    await configManager.saveConfig();
    
    res.json({ success: true });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({ error: '保存配置失败' });
  }
});

// 设置当前代理目标
router.post('/proxy-targets/:id/set-current', async (req, res) => {
  const { id } = req.params;
  
  try {
    const config = configManager.getAll();
    if (!config) {
      return res.status(500).json({ error: '读取配置失败' });
    }
    
    const targetExists = config.PROXY_TARGETS.some(target => target.id === id);
    if (!targetExists) {
      return res.status(400).json({ error: '目标地址不存在' });
    }
    
    configManager.set('CURRENT_PROXY_TARGET', id);
    await configManager.saveConfig();
    
    res.json({ success: true });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({ error: '保存配置失败' });
  }
});

// RDP服务控制
router.post('/enable', (req, res) => {
  try {
    rdpManager.enableRDP();
    rdpManager.reSet();
    res.json({ success: true, message: 'RDP服务开启成功' });
  } catch (error) {
    console.error('开启RDP服务失败:', error);
    res.status(500).json({ error: '开启RDP服务失败' });
  }
});

router.post('/disable', (req, res) => {
  try {
    rdpManager.disableRDP();
    res.json({ success: true, message: 'RDP服务关闭成功' });
  } catch (error) {
    console.error('关闭RDP服务失败:', error);
    res.status(500).json({ error: '关闭RDP服务失败' });
  }
});

// 白名单管理
router.post('/joinwhitelist', (req, res) => {
  try {
    const ip = getIp(req);
    rdpManager.addWhiteList(ip);
    res.json({ success: true, message: '已加入白名单' });
  } catch (error) {
    console.error('加入白名单失败:', error);
    res.status(500).json({ error: '加入白名单失败' });
  }
});

router.post('/removewhitelist', (req, res) => {
  try {
    const ip = getIp(req);
    rdpManager.removeWhiteList(ip);
    res.json({ success: true, message: '已移出白名单' });
  } catch (error) {
    console.error('移出白名单失败:', error);
    res.status(500).json({ error: '移出白名单失败' });
  }
});

// 代理控制
router.post('/openproxy', async (req, res) => {
  try {
    frpc.toggleProxyComment('remote2', false);
    await frpc.reStart();
    res.json({ success: true, message: '代理开启成功' });
  } catch (error) {
    console.error('开启代理失败:', error);
    res.status(500).json({ error: '开启代理失败' });
  }
});

router.post('/closeproxy', async (req, res) => {
  try {
    frpc.toggleProxyComment('remote2', true);
    await frpc.reStart();
    res.json({ success: true, message: '代理关闭成功' });
  } catch (error) {
    console.error('关闭代理失败:', error);
    res.status(500).json({ error: '关闭代理失败' });
  }
});

// 密码修改
router.post('/change-password', async (req, res) => {
  const { userName, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: '两次输入的密码不一致！' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '密码长度必须至少6位！' });
  }

  try {
    await changePassword({ userName, password: newPassword });
    res.json({ success: true, message: '密码修改成功，请使用新密码重新登录！' });
  } catch (error) {
    console.error('密码修改失败:', error);
    res.status(500).json({ error: '密码修改失败' });
  }
});

// 获取页面数据的API
router.get('/page-data', async (req, res) => {
  try {
    const isWindows = process.platform === 'win32';
    const [appStatus, isFrpcInstalled, proxyStatus] = await Promise.all([
      isWindows ? rdpManager.getRDPStatus() : Promise.resolve(false),
      frpc.isInstalled(),
      frpc.isProxyCommented('remote2'),
    ]);

    const ip = getIp(req);
    rdpManager.addTempWhiteList(ip);
    const isInWhiteList = rdpManager.isWhiteList(ip);
    
    // 如果不在白名单中，则提示临时白名单,并出一个连接的截止时间(两分钟后) 
    const whiteListStatus = isInWhiteList
      ? '已加入白名单'
      : `连接有效期至: ${new Date(Date.now() + 120000).toLocaleString()}`;

    // 检测操作系统

    const pageData = {
      isWindows: isWindows,
      rdpStatus: appStatus ? '已启用' : '已关闭',
      rdpEnableDisabled: appStatus ? 'none' : 'block',
      rdpDisableDisabled: appStatus ? 'block' : 'none',
      proxyStatus: isFrpcInstalled ? (proxyStatus ? '关闭' : '开启') : '未安装',
      proxyOpenDisabled: !isFrpcInstalled || !proxyStatus ? 'none' : 'block',
      proxyCloseDisabled: isFrpcInstalled && !proxyStatus ? 'block' : 'none',
      whiteListRemoveDisabled: isInWhiteList ? 'block' : 'none',
      whiteListJoinDisabled: !isInWhiteList ? 'block' : 'none',
      userName: getUserName() || '未登录',
      IP: ip,
      whiteListStatus: whiteListStatus
    };

    res.json(pageData);
  } catch (error) {
    console.error('获取页面数据失败:', error);
    res.status(500).json({ error: '获取页面数据失败' });
  }
});

module.exports = router; 