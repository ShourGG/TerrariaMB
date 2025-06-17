/**
 * 系统控制器模块
 * 提供对Linux系统的直接控制功能
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const os = require('os');

const execPromise = util.promisify(exec);

// 安全命令白名单，只允许执行这些命令
const SAFE_COMMANDS = [
  'ls', 'cd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'find',
  'ps', 'top', 'df', 'du', 'free', 'netstat', 'ifconfig', 'ip',
  'systemctl', 'service', 'journalctl', 'kill', 'pkill',
  'chmod', 'chown', 'tar', 'unzip', 'zip', 'gzip', 'gunzip'
];

// 禁止的命令，这些命令可能会危及系统安全
const FORBIDDEN_COMMANDS = [
  'sudo', 'su', 'passwd', 'visudo', 'dd', 'mkfs',
  'rm -rf /', 'rm -rf /*', '> /dev/sda', 'mkfs',
  'reboot', 'shutdown', 'halt', 'poweroff'
];

/**
 * 检查命令是否安全
 * @param {string} command - 要执行的命令
 * @returns {boolean} - 命令是否安全
 */
function isCommandSafe(command) {
  // 移除命令中的参数，只检查命令本身
  const baseCommand = command.split(' ')[0];
  
  // 检查是否在禁止的命令列表中
  for (const forbidden of FORBIDDEN_COMMANDS) {
    if (command.includes(forbidden)) {
      return false;
    }
  }
  
  // 检查是否在安全命令白名单中
  return SAFE_COMMANDS.includes(baseCommand);
}

/**
 * 执行系统命令
 * @param {string} command - 要执行的命令
 * @param {object} options - 执行选项
 * @returns {Promise<object>} - 命令执行结果
 */
async function executeCommand(command, options = {}) {
  // 检查命令是否安全
  if (!isCommandSafe(command)) {
    return {
      success: false,
      error: '不允许执行此命令，出于安全考虑',
      command
    };
  }
  
  try {
    const { stdout, stderr } = await execPromise(command, options);
    return {
      success: true,
      stdout,
      stderr,
      command
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr,
      stdout: error.stdout,
      command
    };
  }
}

/**
 * 获取系统信息
 * @returns {Promise<object>} - 系统信息
 */
async function getSystemInfo() {
  try {
    // 获取CPU信息
    const cpuInfo = os.cpus();
    const cpuCount = cpuInfo.length;
    const cpuModel = cpuInfo[0].model;
    
    // 获取内存信息
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // 获取操作系统信息
    const platform = os.platform();
    const release = os.release();
    const hostname = os.hostname();
    
    // 获取磁盘信息
    const { stdout: dfOutput } = await execPromise('df -h --output=source,size,used,avail,pcent,target -x tmpfs -x devtmpfs');
    
    // 解析磁盘信息
    const diskInfo = dfOutput
      .split('\n')
      .slice(1) // 跳过标题行
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 6) {
          return {
            filesystem: parts[0],
            size: parts[1],
            used: parts[2],
            available: parts[3],
            usedPercent: parts[4],
            mountpoint: parts.slice(5).join(' ')
          };
        }
        return null;
      })
      .filter(item => item !== null);
    
    // 获取网络信息
    const { stdout: ifconfigOutput } = await execPromise('ip addr show || ifconfig');
    
    // 获取进程信息
    const { stdout: psOutput } = await execPromise('ps aux | head -10');
    
    return {
      success: true,
      system: {
        platform,
        release,
        hostname,
        uptime: os.uptime()
      },
      cpu: {
        model: cpuModel,
        count: cpuCount,
        loadAvg: os.loadavg()
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usedPercent: (usedMemory / totalMemory * 100).toFixed(2)
      },
      disk: diskInfo,
      network: ifconfigOutput,
      processes: psOutput
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 获取文件系统信息
 * @param {string} dirPath - 目录路径
 * @returns {Promise<object>} - 文件系统信息
 */
async function getFileSystemInfo(dirPath = '/home/泰拉瑞亚') {
  try {
    // 确保路径存在
    if (!fs.existsSync(dirPath)) {
      return {
        success: false,
        error: `路径不存在: ${dirPath}`
      };
    }
    
    // 读取目录内容
    const files = await fs.promises.readdir(dirPath);
    
    // 获取文件详细信息
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dirPath, file);
        try {
          const stats = await fs.promises.stat(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            created: stats.birthtime,
            modified: stats.mtime,
            permissions: stats.mode.toString(8).slice(-3)
          };
        } catch (error) {
          return {
            name: file,
            path: filePath,
            error: error.message
          };
        }
      })
    );
    
    return {
      success: true,
      path: dirPath,
      files: fileDetails
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      path: dirPath
    };
  }
}

/**
 * 管理系统服务
 * @param {string} action - 操作类型 (start, stop, restart, status)
 * @param {string} serviceName - 服务名称
 * @returns {Promise<object>} - 操作结果
 */
async function manageService(action, serviceName) {
  // 检查服务名是否安全
  if (!/^[a-zA-Z0-9\-_.]+$/.test(serviceName)) {
    return {
      success: false,
      error: '无效的服务名称',
      service: serviceName
    };
  }
  
  // 检查操作类型是否有效
  const validActions = ['start', 'stop', 'restart', 'status'];
  if (!validActions.includes(action)) {
    return {
      success: false,
      error: '无效的操作类型',
      action
    };
  }
  
  try {
    const { stdout, stderr } = await execPromise(`systemctl ${action} ${serviceName}`);
    
    // 如果是status操作，获取更详细的信息
    let details = {};
    if (action === 'status') {
      const { stdout: statusOutput } = await execPromise(`systemctl status ${serviceName}`);
      details = { statusOutput };
    }
    
    return {
      success: true,
      service: serviceName,
      action,
      stdout,
      stderr,
      ...details
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr,
      service: serviceName,
      action
    };
  }
}

/**
 * 管理系统进程
 * @param {string} action - 操作类型 (kill, info)
 * @param {number} pid - 进程ID
 * @returns {Promise<object>} - 操作结果
 */
async function manageProcess(action, pid) {
  // 检查PID是否为数字
  if (isNaN(parseInt(pid))) {
    return {
      success: false,
      error: '无效的进程ID',
      pid
    };
  }
  
  // 检查操作类型是否有效
  const validActions = ['kill', 'info'];
  if (!validActions.includes(action)) {
    return {
      success: false,
      error: '无效的操作类型',
      action
    };
  }
  
  try {
    if (action === 'kill') {
      const { stdout, stderr } = await execPromise(`kill ${pid}`);
      return {
        success: true,
        action,
        pid,
        stdout,
        stderr
      };
    } else if (action === 'info') {
      const { stdout, stderr } = await execPromise(`ps -p ${pid} -o pid,ppid,user,%cpu,%mem,vsz,rss,tty,stat,start,time,command`);
      return {
        success: true,
        action,
        pid,
        processInfo: stdout,
        stderr
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      action,
      pid
    };
  }
}

module.exports = {
  executeCommand,
  getSystemInfo,
  getFileSystemInfo,
  manageService,
  manageProcess,
  SAFE_COMMANDS
}; 