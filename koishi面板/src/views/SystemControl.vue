<template>
  <div class="system-control-container">
    <el-card class="system-info-card">
      <template #header>
        <div class="card-header">
          <h3>系统信息</h3>
          <el-button type="primary" size="small" @click="refreshSystemInfo">
            刷新
          </el-button>
        </div>
      </template>
      
      <el-skeleton :loading="loading" animated>
        <template #default>
          <div v-if="systemInfo">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="主机名">{{ systemInfo.system.hostname }}</el-descriptions-item>
              <el-descriptions-item label="平台">{{ systemInfo.system.platform }} {{ systemInfo.system.release }}</el-descriptions-item>
              <el-descriptions-item label="CPU">{{ systemInfo.cpu.model }} ({{ systemInfo.cpu.count }} 核)</el-descriptions-item>
              <el-descriptions-item label="负载">{{ systemInfo.cpu.loadAvg.join(', ') }}</el-descriptions-item>
            </el-descriptions>
            
            <h4 class="mt-4">内存使用</h4>
            <el-progress 
              :percentage="parseFloat(systemInfo.memory.usedPercent)" 
              :status="memoryStatus" 
              :stroke-width="20"
              :format="() => `${formatBytes(systemInfo.memory.used)} / ${formatBytes(systemInfo.memory.total)} (${systemInfo.memory.usedPercent}%)`"
            />
          </div>
        </template>
      </el-skeleton>
    </el-card>
    
    <el-card class="terminal-card">
      <template #header>
        <div class="card-header">
          <h3>终端</h3>
          <el-button type="danger" size="small" @click="clearTerminal">
            清空
          </el-button>
        </div>
      </template>
      
      <div class="terminal-output" ref="terminalOutput">
        <div v-for="(line, index) in terminalLines" :key="index" :class="{ 'error-line': line.isError }">
          {{ line.text }}
        </div>
      </div>
      
      <div class="terminal-input">
        <el-input
          v-model="commandInput"
          placeholder="输入命令..."
          @keyup.enter="executeCommand"
          size="large"
        >
          <template #prepend>
            <span class="terminal-prompt">$</span>
          </template>
          <template #append>
            <el-button @click="executeCommand">执行</el-button>
          </template>
        </el-input>
      </div>
    </el-card>
    
    <el-card class="file-explorer-card">
      <template #header>
        <div class="card-header">
          <h3>文件浏览器</h3>
          <div>
            <el-input
              v-model="currentPath"
              placeholder="路径"
              size="small"
              class="path-input"
              @keyup.enter="navigateTo(currentPath)"
            />
            <el-button type="primary" size="small" @click="navigateTo(currentPath)">
              前往
            </el-button>
          </div>
        </div>
      </template>
      
      <el-skeleton :loading="fileLoading" animated>
        <template #default>
          <el-table :data="fileList" style="width: 100%" size="small" v-if="fileList.length > 0">
            <el-table-column label="名称" min-width="200">
              <template #default="{ row }">
                <div class="file-item" @click="handleFileClick(row)">
                  {{ row.name }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="120">
              <template #default="{ row }">
                {{ formatBytes(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="permissions" label="权限" width="80" />
            <el-table-column prop="modified" label="修改时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.modified) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="目录为空" />
        </template>
      </el-skeleton>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

// 状态变量
const loading = ref(true);
const fileLoading = ref(true);
const systemInfo = ref(null);
const terminalLines = ref([
  { text: '欢迎使用泰拉瑞亚服务器Web控制面板终端', isError: false },
  { text: '您可以执行安全的Linux命令', isError: false },
  { text: '输入 "help" 获取帮助', isError: false },
]);
const commandInput = ref('');
const currentPath = ref('/home/泰拉瑞亚');
const fileList = ref([]);
const terminalOutput = ref(null);

// 计算属性
const memoryStatus = computed(() => {
  const percent = parseFloat(systemInfo.value?.memory.usedPercent || 0);
  if (percent > 90) return 'exception';
  if (percent > 70) return 'warning';
  return 'success';
});

// 方法
const refreshSystemInfo = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/system/info');
    if (response.data.success) {
      systemInfo.value = response.data;
    } else {
      ElMessage.error('获取系统信息失败: ' + response.data.error);
    }
  } catch (error) {
    ElMessage.error('获取系统信息失败: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const executeCommand = async () => {
  if (!commandInput.value.trim()) return;
  
  const command = commandInput.value.trim();
  terminalLines.value.push({ text: `$ ${command}`, isError: false });
  
  // 特殊命令处理
  if (command === 'clear') {
    clearTerminal();
    commandInput.value = '';
    return;
  }
  
  if (command === 'help') {
    terminalLines.value.push({ text: '可用命令:', isError: false });
    terminalLines.value.push({ text: '  clear - 清空终端', isError: false });
    terminalLines.value.push({ text: '  help - 显示帮助', isError: false });
    commandInput.value = '';
    scrollToBottom();
    return;
  }
  
  try {
    const response = await axios.post('/api/system/command', { command });
    if (response.data.success) {
      if (response.data.stdout) {
        response.data.stdout.split('\n').forEach(line => {
          terminalLines.value.push({ text: line, isError: false });
        });
      }
      if (response.data.stderr) {
        response.data.stderr.split('\n').forEach(line => {
          if (line.trim()) {
            terminalLines.value.push({ text: line, isError: true });
          }
        });
      }
    } else {
      terminalLines.value.push({ text: `错误: ${response.data.error}`, isError: true });
    }
  } catch (error) {
    terminalLines.value.push({ text: `错误: ${error.message}`, isError: true });
  }
  
  commandInput.value = '';
  scrollToBottom();
};

const clearTerminal = () => {
  terminalLines.value = [
    { text: '终端已清空', isError: false },
  ];
};

const scrollToBottom = () => {
  setTimeout(() => {
    if (terminalOutput.value) {
      terminalOutput.value.scrollTop = terminalOutput.value.scrollHeight;
    }
  }, 50);
};

const loadFileList = async (path = currentPath.value) => {
  fileLoading.value = true;
  try {
    const response = await axios.get('/api/system/files', {
      params: { path }
    });
    
    if (response.data.success) {
      fileList.value = response.data.files;
      currentPath.value = response.data.path;
    } else {
      ElMessage.error('加载文件列表失败: ' + response.data.error);
    }
  } catch (error) {
    ElMessage.error('加载文件列表失败: ' + error.message);
  } finally {
    fileLoading.value = false;
  }
};

const navigateTo = (path) => {
  loadFileList(path);
};

const handleFileClick = (file) => {
  if (file.isDirectory) {
    navigateTo(file.path);
  }
};

const formatBytes = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

// 生命周期钩子
onMounted(() => {
  refreshSystemInfo();
  loadFileList();
});
</script>

<style scoped>
.system-control-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 16px;
  padding: 16px;
  height: calc(100vh - 120px);
}

.system-info-card {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

.terminal-card {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  display: flex;
  flex-direction: column;
}

.file-explorer-card {
  grid-column: 2 / 3;
  grid-row: 1 / 3;
  overflow: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terminal-output {
  flex: 1;
  background-color: #1e1e1e;
  color: #f0f0f0;
  padding: 10px;
  font-family: monospace;
  overflow-y: auto;
  min-height: 300px;
  max-height: 400px;
  white-space: pre-wrap;
  margin-bottom: 10px;
  border-radius: 4px;
}

.terminal-input {
  margin-top: auto;
}

.terminal-prompt {
  color: #409eff;
  font-weight: bold;
}

.error-line {
  color: #f56c6c;
}

.file-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.file-item:hover {
  color: #409eff;
}

.path-input {
  width: 300px;
  margin-right: 8px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
