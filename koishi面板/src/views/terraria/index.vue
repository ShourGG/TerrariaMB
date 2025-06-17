<template>
  <div class="terraria-container">
    <el-row :gutter="20">
      <!-- 左侧 - 服务器控制 -->
      <el-col :span="8">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>服务器控制</span>
            </div>
          </template>
          
          <div class="server-status mb-4">
            <span class="fw-bold">状态: </span>
            <el-tag :type="serverStatus === '运行中' ? 'success' : 'warning'">{{ serverStatus }}</el-tag>
          </div>
          
          <el-form :model="serverForm" label-position="top">
            <el-form-item label="服务器类型">
              <el-select v-model="serverForm.serverType" class="w-100">
                <el-option label="原版" value="vanilla"></el-option>
                <el-option label="模组服(TModLoader)" value="tmodloader"></el-option>
                <el-option label="插件服(TShock)" value="tshock"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="世界名称">
              <el-input v-model="serverForm.worldName"></el-input>
            </el-form-item>
            
            <el-form-item label="最大玩家数">
              <el-input-number v-model="serverForm.playerCount" :min="1" :max="255" class="w-100"></el-input-number>
            </el-form-item>
            
            <el-form-item label="端口">
              <el-input-number v-model="serverForm.port" :min="1" :max="65535" class="w-100"></el-input-number>
            </el-form-item>
          </el-form>
          
          <div class="mt-4">
            <el-button type="primary" :disabled="isServerRunning" @click="startServer" class="w-100 mb-2">启动服务器</el-button>
            <el-button type="danger" :disabled="!isServerRunning" @click="stopServer" class="w-100 mb-2">停止服务器</el-button>
            <el-button type="success" @click="navigateToDownload" class="w-100 mb-2" :icon="Download">下载游戏</el-button>
          </div>
        </el-card>
        
        <el-card class="box-card mt-4">
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          
          <div class="quick-actions">
            <el-button type="primary" :disabled="!isServerRunning" @click="saveWorld" class="w-100 mb-2">保存世界</el-button>
            <el-button type="primary" :disabled="!isServerRunning" @click="checkPlayers" class="w-100 mb-2">查看在线玩家</el-button>
            <el-button type="primary" @click="checkSystem" class="w-100 mb-2">查看系统资源</el-button>
            <el-button type="success" @click="navigateToDownload" class="w-100" :icon="Download">下载游戏</el-button>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧 - 控制台输出 -->
      <el-col :span="16">
        <el-card class="box-card console-card">
          <template #header>
            <div class="card-header d-flex justify-content-between align-items-center">
              <span>服务器控制台</span>
              <el-button type="primary" @click="clearConsole" size="small" plain>清空</el-button>
            </div>
          </template>
          
          <div class="console-output" ref="consoleOutput"></div>
          
          <div class="mt-3">
            <el-input
              v-model="consoleCommand"
              placeholder="输入命令..."
              :disabled="!isServerRunning"
              @keyup.enter="sendCommand"
            >
              <template #append>
                <el-button :disabled="!isServerRunning" @click="sendCommand">发送</el-button>
              </template>
            </el-input>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 系统资源模态框 -->
    <el-dialog v-model="systemInfoVisible" title="系统资源信息" width="50%">
      <pre>{{ systemInfo }}</pre>
    </el-dialog>
  </div>
</template>

<script setup name="TerrariaServer">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import io from 'socket.io-client';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

// 状态变量
const serverStatus = ref('未运行');
const isServerRunning = ref(false);
const consoleOutput = ref(null);
const consoleCommand = ref('');
const systemInfoVisible = ref(false);
const systemInfo = ref('');
const socket = ref(null);

// 服务器表单
const serverForm = ref({
  serverType: 'vanilla',
  worldName: '默认世界',
  playerCount: 8,
  port: 7777
});

// 初始化Socket连接
onMounted(() => {
  // 建立socket连接
  socket.value = io();
  
  // 监听服务器状态变化
  socket.value.on('serverStatus', (status) => {
    updateServerStatus(status);
  });
  
  // 监听服务器输出
  socket.value.on('serverOutput', (output) => {
    appendToConsole(output);
  });
  
  // 获取初始服务器状态
  getServerStatus();
});

// 组件卸载时断开Socket连接
onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});

// 更新服务器状态UI
const updateServerStatus = (status) => {
  serverStatus.value = status;
  isServerRunning.value = status === '运行中';
};

// 获取服务器状态
const getServerStatus = async () => {
  try {
    const { data } = await axios.get('/api/status');
    updateServerStatus(data.status);
    if (data.output) {
      appendToConsole(data.output);
    }
  } catch (error) {
    ElMessage.error('获取服务器状态失败');
  }
};

// 添加输出到控制台
const appendToConsole = (text, className = '') => {
  const element = document.createElement('div');
  element.textContent = text;
  if (className) {
    element.className = className;
  }
  consoleOutput.value.appendChild(element);
  consoleOutput.value.scrollTop = consoleOutput.value.scrollHeight;
};

// 清空控制台
const clearConsole = () => {
  consoleOutput.value.innerHTML = '';
};

// 启动服务器
const startServer = async () => {
  try {
    appendToConsole(`正在启动 ${serverForm.value.serverType} 类型的服务器...`, 'command');
    
    const { data } = await axios.post('/api/start', {
      serverType: serverForm.value.serverType,
      worldName: serverForm.value.worldName,
      playerCount: serverForm.value.playerCount,
      port: serverForm.value.port
    });
    
    if (data.success) {
      ElMessage.success('服务器启动中');
      appendToConsole(data.message, 'success');
    } else {
      ElMessage.error(data.message);
      appendToConsole('错误: ' + data.message, 'error');
    }
  } catch (error) {
    ElMessage.error('启动服务器失败');
    appendToConsole('错误: ' + error.message, 'error');
  }
};

// 停止服务器
const stopServer = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要停止服务器吗？将会先保存世界再停止服务器。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    appendToConsole('正在停止服务器...', 'command');
    
    const { data } = await axios.post('/api/stop');
    
    if (data.success) {
      ElMessage.success('服务器已停止');
      appendToConsole(data.message, 'success');
    } else {
      ElMessage.error(data.message);
      appendToConsole('错误: ' + data.message, 'error');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('停止服务器失败');
      appendToConsole('错误: ' + error.message, 'error');
    }
  }
};

// 保存世界
const saveWorld = async () => {
  if (!isServerRunning.value) return;
  
  try {
    appendToConsole('正在保存世界...', 'command');
    
    const { data } = await axios.post('/api/command', {
      command: 'save'
    });
    
    if (data.success) {
      ElMessage.success('保存命令已发送');
      appendToConsole('保存命令已发送', 'success');
    } else {
      ElMessage.error(data.message);
      appendToConsole('错误: ' + data.message, 'error');
    }
  } catch (error) {
    ElMessage.error('发送命令失败');
    appendToConsole('错误: ' + error.message, 'error');
  }
};

// 查看在线玩家
const checkPlayers = async () => {
  if (!isServerRunning.value) return;
  
  try {
    appendToConsole('正在查询在线玩家...', 'command');
    
    const { data } = await axios.post('/api/command', {
      command: 'playing'
    });
    
    if (data.success) {
      ElMessage.success('查询命令已发送');
      appendToConsole('查询命令已发送', 'success');
    } else {
      ElMessage.error(data.message);
      appendToConsole('错误: ' + data.message, 'error');
    }
  } catch (error) {
    ElMessage.error('发送命令失败');
    appendToConsole('错误: ' + error.message, 'error');
  }
};

// 查看系统资源
const checkSystem = async () => {
  try {
    const { data } = await axios.get('/api/system');
    
    if (data.success) {
      systemInfo.value = data.data;
      systemInfoVisible.value = true;
    } else {
      ElMessage.error(data.message);
    }
  } catch (error) {
    ElMessage.error('获取系统资源信息失败');
  }
};

// 发送命令到服务器
const sendCommand = async () => {
  const command = consoleCommand.value.trim();
  if (command && isServerRunning.value) {
    appendToConsole(`> ${command}`, 'command');
    
    try {
      const { data } = await axios.post('/api/command', {
        command
      });
      
      if (!data.success) {
        ElMessage.error(data.message);
        appendToConsole('错误: ' + data.message, 'error');
      }
    } catch (error) {
      ElMessage.error('发送命令失败');
      appendToConsole('错误: ' + error.message, 'error');
    }
    
    // 清空命令输入
    consoleCommand.value = '';
  }
};

// 导航到下载游戏页面
const navigateToDownload = () => {
  router.push('/download');
};
</script>

<style lang="scss" scoped>
.terraria-container {
  padding: 20px;
}

.card-header {
  font-weight: bold;
}

.server-status {
  margin-bottom: 20px;
}

.w-100 {
  width: 100%;
}

.console-card {
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
}

.console-output {
  height: 450px;
  overflow-y: auto;
  background-color: #1e1e1e;
  color: #dcdcdc;
  padding: 10px;
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  border-radius: 5px;
  margin-bottom: 10px;
  flex: 1;
  
  .command {
    color: #67b0e8;
    font-weight: bold;
  }
  
  .error {
    color: #f77;
  }
  
  .success {
    color: #7f7;
  }
  
  .warning {
    color: #fd7;
  }
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}
</style> 