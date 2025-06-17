/**
 * 泰拉瑞亚服务器文件解压处理模块
 * 用于处理下载完成后的文件解压和安装
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// 定义基础路径 - 确保使用Linux路径格式
const BASE_DIR = process.env.HOME || '/home/泰拉瑞亚'; // 使用环境变量获取用户主目录
const TERRARIA_DIR = path.join(BASE_DIR, 'Terraria');
const DOWNLOAD_DIR = path.join(TERRARIA_DIR, 'Downloads');
const SERVER_DIR = path.join(TERRARIA_DIR, 'server');
const MODDED_DIR = path.join(TERRARIA_DIR, 'TMLserver');
const PLUGIN_DIR = path.join(TERRARIA_DIR, 'TSserver');

// 确保目录存在
function ensureDirectories() {
  [TERRARIA_DIR, DOWNLOAD_DIR, SERVER_DIR, MODDED_DIR, PLUGIN_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`创建目录: ${dir}`);
    }
  });
}

/**
 * 解压文件
 * @param {string} filePath - 压缩文件路径
 * @param {string} targetDir - 解压目标目录
 * @param {function} callback - 回调函数，参数为(error, result)
 */
function extractFile(filePath, targetDir, callback) {
  // 确保目录存在
  ensureDirectories();
  
  // 确保目标目录存在
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  console.log(`开始解压 ${filePath} 到 ${targetDir}`);
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return callback(new Error(`文件不存在: ${filePath}`));
  }
  
  // 检查文件是否有权限读取
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (error) {
    return callback(new Error(`没有权限读取文件: ${filePath}, 错误: ${error.message}`));
  }
  
  // 根据文件扩展名选择解压方法
  const ext = path.extname(filePath).toLowerCase();
  
  // 创建解压命令
  let command = '';
  
  if (ext === '.zip') {
    // 先检查unzip命令是否存在
    exec('which unzip', (whichError) => {
      if (whichError) {
        console.error('未找到unzip命令，尝试安装...');
        exec('apt-get update && apt-get install -y unzip', (installError) => {
          if (installError) {
            return callback(new Error(`安装unzip失败: ${installError.message}`));
          }
          executeExtract();
        });
      } else {
        executeExtract();
      }
    });
    
    command = `unzip -o "${filePath}" -d "${targetDir}"`;
  } else if (ext === '.tar') {
    command = `tar -xf "${filePath}" -C "${targetDir}"`;
  } else if (ext === '.gz' || ext === '.tgz') {
    command = `tar -xzf "${filePath}" -C "${targetDir}"`;
  } else if (ext === '.bz2') {
    command = `tar -xjf "${filePath}" -C "${targetDir}"`;
  } else if (ext === '.xz') {
    command = `tar -xJf "${filePath}" -C "${targetDir}"`;
  } else if (ext === '.7z') {
    // 检查7z命令是否存在
    exec('which 7z', (whichError) => {
      if (whichError) {
        console.error('未找到7z命令，尝试安装...');
        exec('apt-get update && apt-get install -y p7zip-full', (installError) => {
          if (installError) {
            return callback(new Error(`安装7z失败: ${installError.message}`));
          }
          executeExtract();
        });
      } else {
        executeExtract();
      }
    });
    
    command = `7z x "${filePath}" -o"${targetDir}" -y`;
  } else if (ext === '.rar') {
    // 检查unrar命令是否存在
    exec('which unrar', (whichError) => {
      if (whichError) {
        console.error('未找到unrar命令，尝试安装...');
        exec('apt-get update && apt-get install -y unrar', (installError) => {
          if (installError) {
            return callback(new Error(`安装unrar失败: ${installError.message}`));
          }
          executeExtract();
        });
      } else {
        executeExtract();
      }
    });
    
    command = `unrar x "${filePath}" "${targetDir}"`;
  } else {
    return callback(new Error(`不支持的文件格式: ${ext}`));
  }
  
  function executeExtract() {
    console.log(`执行解压命令: ${command}`);
    
    // 执行解压命令
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`解压错误: ${error}`);
        console.error(`错误详情: ${stderr}`);
        return callback(error);
      }
      
      console.log(`解压完成: ${filePath}`);
      console.log(`标准输出: ${stdout}`);
      
      if (stderr) {
        console.warn(`标准错误: ${stderr}`);
      }
      
      // 设置权限
      exec(`chmod -R 755 "${targetDir}"`, (chmodError) => {
        if (chmodError) {
          console.warn(`设置权限失败: ${chmodError}`);
        }
        
        callback(null, { success: true, message: '解压完成' });
      });
    });
  }
  
  // 对于非需要安装检查的命令，直接执行
  if (ext === '.tar' || ext === '.gz' || ext === '.tgz' || ext === '.bz2' || ext === '.xz') {
    executeExtract();
  }
}

/**
 * 根据文件名判断服务器类型并解压到对应目录
 * @param {string} filePath - 压缩文件路径
 * @param {function} callback - 回调函数
 */
function handleServerFile(filePath, callback) {
  const fileName = path.basename(filePath).toLowerCase();
  
  // 判断服务器类型
  let targetDir = SERVER_DIR;
  let serverType = 'vanilla';
  
  if (fileName.includes('tmodloader') || fileName.includes('tmod')) {
    targetDir = MODDED_DIR;
    serverType = 'tmodloader';
  } else if (fileName.includes('tshock') || fileName.includes('plugin')) {
    targetDir = PLUGIN_DIR;
    serverType = 'tshock';
  }
  
  // 解压文件
  extractFile(filePath, targetDir, (error, result) => {
    if (error) {
      return callback(error);
    }
    
    // 创建启动脚本
    createLaunchScript(serverType, targetDir, (scriptError) => {
      if (scriptError) {
        console.warn(`创建启动脚本失败: ${scriptError}`);
      }
      
      callback(null, {
        success: true,
        message: `解压完成，服务器类型: ${serverType}`,
        serverType,
        targetDir
      });
    });
  });
}

/**
 * 创建服务器启动脚本
 * @param {string} serverType - 服务器类型
 * @param {string} targetDir - 目标目录
 * @param {function} callback - 回调函数
 */
function createLaunchScript(serverType, targetDir, callback) {
  let scriptContent = '';
  let scriptName = '';
  
  switch (serverType) {
    case 'vanilla':
      scriptName = 'start-server.sh';
      scriptContent = `#!/bin/bash
# 泰拉瑞亚原版服务器启动脚本
cd "${targetDir}"
chmod +x TerrariaServer.bin.x86_64
./TerrariaServer.bin.x86_64 -config serverconfig.txt
`;
      break;
    case 'tmodloader':
      scriptName = 'start-tmodloader.sh';
      scriptContent = `#!/bin/bash
# tModLoader服务器启动脚本
cd "${targetDir}"
mono --server --gc=sgen -O=all tModLoader.exe -server -config serverconfig.txt
`;
      break;
    case 'tshock':
      scriptName = 'start-tshock.sh';
      scriptContent = `#!/bin/bash
# TShock服务器启动脚本
cd "${targetDir}"
mono --server --gc=sgen -O=all TShock.Server.exe -config serverconfig.txt
`;
      break;
    default:
      return callback(new Error(`未知的服务器类型: ${serverType}`));
  }
  
  const scriptPath = path.join(targetDir, scriptName);
  
  // 写入启动脚本
  fs.writeFile(scriptPath, scriptContent, { mode: 0o755 }, (error) => {
    if (error) {
      return callback(error);
    }
    
    // 设置可执行权限
    fs.chmod(scriptPath, 0o755, (chmodError) => {
      if (chmodError) {
        console.warn(`设置脚本权限失败: ${chmodError}`);
      }
      
      callback(null);
    });
  });
}

/**
 * 检查并处理下载目录中的所有文件
 * @param {function} callback - 回调函数
 */
function processDownloadDirectory(callback) {
  // 确保下载目录存在
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
  
  // 读取下载目录中的所有文件
  fs.readdir(DOWNLOAD_DIR, (error, files) => {
    if (error) {
      return callback(error);
    }
    
    // 过滤出压缩文件
    const compressedFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.zip', '.tar', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.rar'].includes(ext);
    });
    
    if (compressedFiles.length === 0) {
      return callback(null, { message: '没有找到需要处理的压缩文件' });
    }
    
    // 处理每个压缩文件
    let processed = 0;
    const results = [];
    
    compressedFiles.forEach(file => {
      const filePath = path.join(DOWNLOAD_DIR, file);
      
      handleServerFile(filePath, (handleError, result) => {
        processed++;
        
        if (handleError) {
          results.push({
            file,
            success: false,
            error: handleError.message
          });
        } else {
          results.push({
            file,
            success: true,
            ...result
          });
        }
        
        // 全部处理完成后回调
        if (processed === compressedFiles.length) {
          callback(null, results);
        }
      });
    });
  });
}

module.exports = {
  extractFile,
  handleServerFile,
  processDownloadDirectory,
  ensureDirectories
}; 