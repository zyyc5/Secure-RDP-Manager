const express = require('express');
const router = express.Router();
const path = require('path');

// 主页路由 - 直接提供静态HTML文件
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

module.exports = router; 