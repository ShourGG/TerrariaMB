const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// 用户数据文件路径
const USER_DATA_FILE = path.join(__dirname, '../../../userData.json');

// 确保用户数据文件存在
const ensureUserDataFile = () => {
  if (!fs.existsSync(USER_DATA_FILE)) {
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify({ exists: false }), 'utf8');
  }
};

// 获取用户数据
router.get('/', (req, res) => {
  try {
    ensureUserDataFile();
    const userData = JSON.parse(fs.readFileSync(USER_DATA_FILE, 'utf8'));
    
    if (!userData.exists) {
      return res.json(null);
    }
    
    return res.json({
      username: userData.username,
      // 不返回密码等敏感信息
    });
  } catch (error) {
    console.error('读取用户数据文件失败:', error);
    return res.status(500).json({ error: '读取用户数据失败' });
  }
});

// 保存用户数据
router.post('/', (req, res) => {
  try {
    ensureUserDataFile();
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const userData = {
      exists: true,
      username,
      password,
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify(userData), 'utf8');
    return res.json({ success: true });
  } catch (error) {
    console.error('保存用户数据失败:', error);
    return res.status(500).json({ error: '保存用户数据失败' });
  }
});

// 验证用户登录
router.post('/validate', (req, res) => {
  try {
    ensureUserDataFile();
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const userData = JSON.parse(fs.readFileSync(USER_DATA_FILE, 'utf8'));
    
    if (!userData.exists) {
      return res.json({ valid: false });
    }
    
    const isValid = userData.username === username && userData.password === password;
    return res.json({ valid: isValid });
  } catch (error) {
    console.error('验证用户失败:', error);
    return res.status(500).json({ error: '验证用户失败' });
  }
});

module.exports = router; 