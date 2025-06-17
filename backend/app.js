const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');
const fs = require('fs');
const https = require('https');
// 引入解压处理模块
const extractHandler = require('./extract-handler');
// 引入系统控制器模块
const systemController = require('./system-controller');

// 检查命令行参数
const enableSystemControl = process.argv.includes('--enable-system-control');

// 初始化应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 在express配置部分顶部添加
const koishiDistPath = path.join('/home/泰拉瑞亚/koishi面板/dist');
let useKoishiDist = false;

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 检查是否存在Koishi前端构建目录
try {
  useKoishiDist = fs.existsSync(koishiDistPath) && fs.statSync(koishiDistPath).isDirectory();
} catch (err) {
  console.log('Koishi前端目录不存在，使用内置页面');
}

// 如果Koishi前端已构建，优先使用它
if (useKoishiDist) {
  console.log('使用Koishi前端UI');
  app.use(express.static(koishiDistPath));
} else {
  console.log('使用默认前端UI');
  app.use(express.static(path.join(__dirname, 'public')));
}

// CORS 配置 - 允许所有跨域请求
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 服务器状态变量
let terrariaProcess = null;
let serverStatus = '未运行';
let serverOutput = [];
const maxOutputLines = 100;
let serverStartTime = null;
let onlinePlayers = 0;

// API路由
// 启动服务器
app.post('/api/start', (req, res) => {
  if (terrariaProcess) {
    return res.json({ success: false, message: '服务器已在运行中' });
  }

  const { playerCount = 8, worldName = '默认世界', port = 7777, serverType = 'vanilla' } = req.body;
  
  let command = '';
  let args = [];

  switch (serverType) {
    case 'vanilla':
      command = '/bin/bash';
      args = ['-c', `cd /home/泰拉瑞亚 && ./tr.sh 1 ${playerCount} ${worldName} ${port}`];
      break;
    case 'tmodloader':
      command = '/bin/bash';
      args = ['-c', `cd /home/泰拉瑞亚 && ./tr.sh 1 ${playerCount} ${worldName} ${port} tmod`];
      break;
    case 'tshock':
      command = '/bin/bash';
      args = ['-c', `cd /home/泰拉瑞亚 && ./tr.sh 1 ${playerCount} ${worldName} ${port} tshock`];
      break;
  }

  terrariaProcess = spawn(command, args);
  serverStatus = '运行中';
  serverStartTime = Date.now();
  
  terrariaProcess.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput.push(output);
    if (serverOutput.length > maxOutputLines) {
      serverOutput.shift();
    }
    io.emit('serverOutput', output);
    
    // 检测在线玩家信息
    if (output.includes('玩家数量:')) {
      try {
        const match = output.match(/玩家数量: (\d+)/);
        if (match && match[1]) {
          onlinePlayers = parseInt(match[1]);
        }
      } catch (err) {
        console.error('解析玩家数据错误:', err);
      }
    }
  });

  terrariaProcess.stderr.on('data', (data) => {
    const output = data.toString();
    serverOutput.push(output);
    if (serverOutput.length > maxOutputLines) {
      serverOutput.shift();
    }
    io.emit('serverOutput', output);
  });

  terrariaProcess.on('close', (code) => {
    serverStatus = `已关闭 (退出码: ${code})`;
    terrariaProcess = null;
    serverStartTime = null;
    onlinePlayers = 0;
    io.emit('serverStatus', serverStatus);
  });

  res.json({ success: true, message: '服务器启动中' });
});

// 停止服务器
app.post('/api/stop', (req, res) => {
  if (!terrariaProcess) {
    return res.json({ success: false, message: '服务器未运行' });
  }

  // 向服务器发送save指令，保存世界
  terrariaProcess.stdin.write('save\n');
  
  // 延迟2秒后发送exit指令
  setTimeout(() => {
    terrariaProcess.stdin.write('exit\n');
    terrariaProcess = null;
    serverStatus = '已关闭';
    serverStartTime = null;
    onlinePlayers = 0;
    io.emit('serverStatus', serverStatus);
    res.json({ success: true, message: '服务器已停止' });
  }, 2000);
});

// 获取服务器状态
app.get('/api/status', (req, res) => {
  // 计算uptime
  let uptime = '0分钟';
  if (serverStartTime) {
    const uptimeMs = Date.now() - serverStartTime;
    const uptimeMin = Math.floor(uptimeMs / (1000 * 60));
    const uptimeHours = Math.floor(uptimeMin / 60);
    const uptimeMinRemainder = uptimeMin % 60;
    
    if (uptimeHours > 0) {
      uptime = `${uptimeHours}小时${uptimeMinRemainder}分钟`;
    } else {
      uptime = `${uptimeMin}分钟`;
    }
  }
  
  res.json({
    status: serverStatus,
    output: serverOutput.join(''),
    uptime: uptime,
    players: onlinePlayers
  });
});

// 发送命令到服务器
app.post('/api/command', (req, res) => {
  const { command } = req.body;
  
  if (!terrariaProcess) {
    return res.json({ success: false, message: '服务器未运行' });
  }
  
  terrariaProcess.stdin.write(command + '\n');
  res.json({ success: true, message: '命令已发送' });
});

// 获取系统信息
app.get('/api/system', (req, res) => {
  exec('free -m && df -h', (error, stdout, stderr) => {
    if (error) {
      return res.json({ success: false, message: error.message });
    }
    res.json({ success: true, data: stdout });
  });
});

// 新增 - 游戏下载API
app.post('/api/download-game', (req, res) => {
  const { url, fileName, type } = req.body;
  
  if (!url || !fileName || !type) {
    return res.json({ success: false, message: '参数不完整' });
  }
  
  let targetDir = '';
  switch(type) {
    case 'original':
      targetDir = 'server';
      break;
    case 'modded':
      targetDir = 'TMLserver';
      break;
    case 'plugin':
      targetDir = 'TSserver';
      break;
    default:
      return res.json({ success: false, message: '未知游戏类型' });
  }
  
  // 确保下载目录存在
  const userDir = os.userInfo().homedir;
  const downloadDir = path.join(userDir, 'Terraria/Downloads');
  
  try {
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    // 设置权限
    fs.chmodSync(downloadDir, 0o775);
  } catch (err) {
    console.error('创建下载目录失败:', err);
    return res.json({ success: false, message: `创建下载目录失败: ${err.message}` });
  }
  
  const downloadPath = path.join(downloadDir, fileName);
  const file = fs.createWriteStream(downloadPath);
  
  console.log(`开始下载: ${url} 到 ${downloadPath}`);
  
  // 定义下载函数，可以处理重定向
  const downloadFile = (downloadUrl) => {
    // 根据URL协议选择HTTP或HTTPS
    const protocol = downloadUrl.startsWith('https') ? require('https') : require('http');
    
    // 使用Node.js直接下载文件
    const request = protocol.get(downloadUrl, function(response) {
      // 处理重定向（HTTP 301, 302, 307, 308）
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`收到重定向(${response.statusCode})，跟随到新地址: ${response.headers.location}`);
        return downloadFile(response.headers.location);
      }

      // 检查响应状态码
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(downloadPath, () => {}); // 删除部分下载的文件
        return res.json({ 
          success: false, 
          message: `下载失败，HTTP状态码: ${response.statusCode} ${response.statusMessage}` 
        });
      }
      
      // 获取文件大小
      const fileSize = parseInt(response.headers['content-length'], 10) || 0;
      let downloadedSize = 0;
      
      response.pipe(file);
      
      // 处理下载进度
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = fileSize > 0 ? (downloadedSize / fileSize * 100).toFixed(2) : 'unknown';
        console.log(`下载进度: ${progress}%`);
        
        // 通过Socket.io发送进度信息
        io.emit('downloadProgress', {
          fileName,
          progress,
          downloadedSize,
          fileSize
        });
      });
      
      file.on('finish', function() {
        file.close();
        console.log(`下载完成: ${fileName}`);
        
        // 发送下载完成事件
        io.emit('downloadComplete', {
          fileName,
          targetDir,
          path: downloadPath
        });
        
        // 自动解压和安装
        extractHandler.handleServerFile(downloadPath, (error, result) => {
          if (error) {
            console.error('解压失败:', error);
            io.emit('extractError', {
              fileName,
              error: error.message
            });
            
            res.json({ 
              success: true, 
              message: '下载任务已完成，但解压失败：' + error.message,
              fileName,
              targetDir,
              path: downloadPath,
              extractSuccess: false
            });
          } else {
            console.log('解压成功:', result);
            io.emit('extractComplete', {
              fileName,
              ...result
            });
            
            res.json({ 
              success: true, 
              message: '下载任务已完成，系统已自动解压安装',
              fileName,
              targetDir: result.targetDir,
              serverType: result.serverType,
              path: downloadPath,
              extractSuccess: true
            });
          }
        });
      });
      
      // 处理文件写入错误
      file.on('error', function(err) {
        file.close();
        fs.unlink(downloadPath, () => {}); // 删除部分下载的文件
        console.error('文件写入错误:', err);
        res.json({ success: false, message: `文件写入错误: ${err.message}` });
      });
    }).on('error', function(err) {
      file.close();
      fs.unlink(downloadPath, () => {}); // 删除部分下载的文件
      console.error('下载错误:', err);
      res.json({ success: false, message: `下载错误: ${err.message}` });
    }).on('timeout', function() {
      request.abort();
      file.close();
      fs.unlink(downloadPath, () => {}); // 删除部分下载的文件
      console.error('下载超时');
      res.json({ success: false, message: '下载超时，请稍后再试' });
    });
    
    // 设置请求超时时间
    request.setTimeout(60000); // 60秒
  };

  // 开始下载
  downloadFile(url);
});

// 新增 - 获取游戏版本API
app.get('/api/game-versions', (req, res) => {
  // 这里可以从缓存或配置中获取版本信息
  // 简单起见，这里使用硬编码的版本列表
  const tmodVersions = [
    'v2025.05.2.0 (最新预览版)',
    'v2025.04.3.0 (最新稳定版)',
    'v2025.04.2.2',
    'v2025.04.2.1',
    'v2025.03.3.1',
    'v2025.03.3.0'
  ];
  
  const tshockVersions = [
    'v5.2 for 1.4.4.9 (最新)',
    'v5.1.3 for 1.4.4.8',
    'v5.0 for 1.4.4.7'
  ];
  
  res.json({
    success: true,
    versions: req.query.type === 'tshock' ? tshockVersions : tmodVersions
  });
});

// 获取下载状态API
app.get('/api/download-status', (req, res) => {
  // 获取真实的下载目录数据
  const downloadDirPath = '/home/泰拉瑞亚/Terraria/Downloads';
  
  try {
    // 确保目录存在
    fs.mkdirSync(downloadDirPath, { recursive: true });
    
    // 读取目录内容
    const files = fs.readdirSync(downloadDirPath)
      .filter(file => fs.statSync(path.join(downloadDirPath, file)).isFile())
      .map(file => {
        const stats = fs.statSync(path.join(downloadDirPath, file));
        return {
          name: file,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          modTime: new Date(stats.mtime).toLocaleString('zh-CN')
        };
      });
      
    const data = {
      success: true,
      downloadDir: {
        path: downloadDirPath,
        fileCount: files.length,
        files: files
      },
      installDirs: [
        {
          name: 'server',
          exists: true,
          fileCount: 3,
          files: ['TerrariaServer', 'TerrariaServer.bin.x86_64', 'start-server.sh']
        },
        {
          name: 'TMLserver',
          exists: true,
          fileCount: 5,
          files: ['start-tmodloader.sh', 'tModLoader.dll', 'tModLoader.exe', 'tModLoader.xml', 'Terraria.dll']
        },
        {
          name: 'TSserver',
          exists: true,
          fileCount: 4,
          files: ['TShock.Server.exe', 'TShock.dll', 'TShockAPI.dll', 'ServerPlugins']
        }
      ]
    };
    
    return res.json(data);
  } catch (error) {
    console.error('读取下载状态失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '读取下载状态失败',
      error: error.message 
    });
  }
});

// 新增 - 获取详细系统资源信息
app.get('/api/system/resources', (req, res) => {
  // 获取CPU信息
  const cpuCores = os.cpus().length;
  const loadAvg = os.loadavg();
  
  // 执行CPU使用率计算
  exec("top -b -n1 | grep 'Cpu(s)' | awk '{print $2}'", (error, stdout, stderr) => {
    let cpuUsage = 0;
    if (!error) {
      cpuUsage = parseFloat(stdout).toFixed(1);
    }
    
    // 内存信息
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(1);
    
    // 获取磁盘信息
    exec('df -h --output=source,size,used,avail,pcent,target -x tmpfs -x devtmpfs', (dfError, dfStdout) => {
      let diskInfo = [];
      
      if (!dfError) {
        // 解析df输出
        const lines = dfStdout.split('\n').slice(1); // 跳过标题行
        
        lines.forEach(line => {
          if (line.trim()) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 6) {
              diskInfo.push({
                filesystem: parts[0],
                size: parts[1],
                used: parts[2],
                available: parts[3],
                usedPercent: parts[4].replace('%', ''),
                mountpoint: parts.slice(5).join(' ')
              });
            }
          }
        });
      }
      
      res.json({
        success: true,
        cpu: {
          usage: cpuUsage,
          cores: cpuCores,
          loadAvg: loadAvg
        },
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          available: freeMemory,
          usagePercent: memoryUsagePercent
        },
        disk: diskInfo
      });
    });
  });
});

// 用户存储API
// 用户数据文件路径
const USER_DATA_FILE = path.join('/home/泰拉瑞亚', 'userData.json');

// 确保用户数据文件存在
const ensureUserDataFile = () => {
  if (!fs.existsSync(USER_DATA_FILE)) {
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify({ exists: false }), 'utf8');
  }
};

// 获取用户数据
app.get('/api/user/storage', (req, res) => {
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
app.post('/api/user/storage', (req, res) => {
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
app.post('/api/user/storage/validate', (req, res) => {
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

// 前端路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 测试API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API测试成功', success: true });
});

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log('用户已连接');
  
  // 发送当前状态给新连接的用户
  socket.emit('serverStatus', serverStatus);
  socket.emit('serverOutput', serverOutput.join(''));
  
  // 处理从客户端发送的命令
  socket.on('sendCommand', (command) => {
    if (terrariaProcess) {
      terrariaProcess.stdin.write(command + '\n');
    }
  });
  
  // 处理下载请求
  socket.on('requestDownload', (data) => {
    console.log('收到下载请求:', data);
    // 此处可以调用下载API
  });
  
  // 处理服务器启动请求
  socket.on('startServer', (config) => {
    if (terrariaProcess) {
      socket.emit('serverMessage', { type: 'warning', message: '服务器已在运行中' });
      return;
    }
    
    const { playerCount = 8, worldName = '默认世界', port = 7777, serverType = 'vanilla' } = config;
    
    let command = '';
    let args = [];

    switch (serverType) {
      case 'vanilla':
        command = '/bin/bash';
        args = ['-c', `cd /home/泰拉瑞亚 && ./tr.sh 1 ${playerCount} ${worldName} ${port}`];
        break;
      case 'tmodloader':
        command = '/bin/bash';
        args = ['-c', `cd /home/泰拉瑞亚 && ./tr.sh 1 ${playerCount} ${worldName} ${port} tmod`];
        break;
      case 'tshock':
        command = '/bin/bash';
        args = ['-c', `cd /home/泰拉瑞亚 && ./tr.sh 1 ${playerCount} ${worldName} ${port} tshock`];
        break;
    }

    terrariaProcess = spawn(command, args);
    serverStatus = '运行中';
    serverStartTime = Date.now();
    
    socket.emit('serverMessage', { type: 'success', message: '服务器启动中' });
    io.emit('serverStatus', serverStatus);
    
    terrariaProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput.push(output);
      if (serverOutput.length > maxOutputLines) {
        serverOutput.shift();
      }
      io.emit('serverOutput', output);
      
      // 检测在线玩家信息
      if (output.includes('玩家数量:')) {
        try {
          const match = output.match(/玩家数量: (\d+)/);
          if (match && match[1]) {
            onlinePlayers = parseInt(match[1]);
          }
        } catch (err) {
          console.error('解析玩家数据错误:', err);
        }
      }
    });

    terrariaProcess.stderr.on('data', (data) => {
      const output = data.toString();
      serverOutput.push(output);
      if (serverOutput.length > maxOutputLines) {
        serverOutput.shift();
      }
      io.emit('serverOutput', output);
    });

    terrariaProcess.on('close', (code) => {
      serverStatus = `已关闭 (退出码: ${code})`;
      terrariaProcess = null;
      serverStartTime = null;
      onlinePlayers = 0;
      io.emit('serverStatus', serverStatus);
    });
  });
  
  // 处理服务器停止请求
  socket.on('stopServer', () => {
    if (!terrariaProcess) {
      socket.emit('serverMessage', { type: 'warning', message: '服务器未运行' });
      return;
    }

    // 向服务器发送save指令，保存世界
    terrariaProcess.stdin.write('save\n');
    
    // 延迟2秒后发送exit指令
    setTimeout(() => {
      terrariaProcess.stdin.write('exit\n');
      terrariaProcess = null;
      serverStatus = '已关闭';
      serverStartTime = null;
      onlinePlayers = 0;
      io.emit('serverStatus', serverStatus);
      socket.emit('serverMessage', { type: 'success', message: '服务器已停止' });
    }, 2000);
  });
  
  socket.on('disconnect', () => {
    console.log('用户已断开连接');
  });
});

// 添加新的API端点，用于手动触发解压
app.post('/api/extract', (req, res) => {
  const { filePath, targetDir } = req.body;
  
  if (!filePath) {
    return res.status(400).json({ success: false, message: '缺少文件路径参数' });
  }
  
  // 如果没有指定目标目录，根据文件名判断
  if (!targetDir) {
    extractHandler.handleServerFile(filePath, (error, result) => {
      if (error) {
        return res.status(500).json({ success: false, message: `解压失败: ${error.message}` });
      }
      
      res.json({ success: true, ...result });
    });
  } else {
    extractHandler.extractFile(filePath, targetDir, (error, result) => {
      if (error) {
        return res.status(500).json({ success: false, message: `解压失败: ${error.message}` });
      }
      
      res.json({ success: true, ...result });
    });
  }
});

// 添加新的API端点，用于处理下载目录中的所有文件
app.post('/api/extract-all', (req, res) => {
  extractHandler.processDownloadDirectory((error, results) => {
    if (error) {
      return res.status(500).json({ success: false, message: `处理失败: ${error.message}` });
    }
    
    res.json({ success: true, results });
  });
});

// 添加系统控制API路由
if (enableSystemControl) {
  console.log('系统控制功能已启用');
  
  // 执行系统命令
  app.post('/api/system/command', async (req, res) => {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ success: false, message: '缺少命令参数' });
    }
    
    const result = await systemController.executeCommand(command);
    res.json(result);
  });
  
  // 获取系统信息
  app.get('/api/system/info', async (req, res) => {
    const systemInfo = await systemController.getSystemInfo();
    res.json(systemInfo);
  });
  
  // 获取文件系统信息
  app.get('/api/system/files', async (req, res) => {
    const { path: dirPath = '/home/泰拉瑞亚' } = req.query;
    const fileSystemInfo = await systemController.getFileSystemInfo(dirPath);
    res.json(fileSystemInfo);
  });
  
  // 管理系统服务
  app.post('/api/system/service', async (req, res) => {
    const { action, service } = req.body;
    
    if (!action || !service) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const result = await systemController.manageService(action, service);
    res.json(result);
  });
  
  // 管理系统进程
  app.post('/api/system/process', async (req, res) => {
    const { action, pid } = req.body;
    
    if (!action || !pid) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const result = await systemController.manageProcess(action, pid);
    res.json(result);
  });
  
  // 获取安全命令列表
  app.get('/api/system/safe-commands', (req, res) => {
    res.json({
      success: true,
      commands: systemController.SAFE_COMMANDS
    });
  });
} else {
  // 如果系统控制功能未启用，则返回错误信息
  app.all('/api/system/*', (req, res) => {
    res.status(403).json({
      success: false,
      message: '系统控制功能未启用，请使用 --enable-system-control 参数启动服务器'
    });
  });
}

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`泰拉瑞亚Web控制面板运行在端口 ${PORT}`);
}); 