<template>
  <div class="p-4px">
    <el-card class="rounded-md dark:bg-black" shadow="hover">
      <div class="card-header">
        <h2>泰拉瑞亚服务器控制系统</h2>
        <p>系统资源监控</p>
      </div>
    </el-card>
    
    <el-row :gutter="20" class="m-t-20px">
      <!-- CPU使用率 -->
      <el-col :span="12" :lg="12" :md="12" :sm="24" :xs="24">
        <el-card class="rounded-md dark:bg-black" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>CPU 使用率</span>
            </div>
          </template>
          <div class="chart-container">
            <div class="resource-info">
              <el-progress 
                type="dashboard" 
                :percentage="cpuUsage" 
                :color="cpuUsageColor" 
                :stroke-width="14" 
                :width="200">
                <template #default>
                  <div class="progress-content">
                    <h3>{{ cpuUsage }}%</h3>
                    <p>CPU使用率</p>
                  </div>
                </template>
              </el-progress>
            </div>
            <div class="resource-details">
              <p><strong>系统内核数:</strong> {{ cpuInfo.cores }}</p>
              <p><strong>1分钟负载:</strong> {{ cpuInfo.loadAvg[0] }}</p>
              <p><strong>5分钟负载:</strong> {{ cpuInfo.loadAvg[1] }}</p>
              <p><strong>15分钟负载:</strong> {{ cpuInfo.loadAvg[2] }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 内存使用率 -->
      <el-col :span="12" :lg="12" :md="12" :sm="24" :xs="24">
        <el-card class="rounded-md dark:bg-black" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>内存使用情况</span>
            </div>
          </template>
          <div class="chart-container">
            <div class="resource-info">
              <el-progress 
                type="dashboard" 
                :percentage="memoryUsage" 
                :color="memoryUsageColor" 
                :stroke-width="14" 
                :width="200">
                <template #default>
                  <div class="progress-content">
                    <h3>{{ memoryUsage }}%</h3>
                    <p>内存使用率</p>
                  </div>
                </template>
              </el-progress>
            </div>
            <div class="resource-details">
              <p><strong>总内存:</strong> {{ formatBytes(memoryInfo.total) }}</p>
              <p><strong>已使用:</strong> {{ formatBytes(memoryInfo.used) }}</p>
              <p><strong>空闲:</strong> {{ formatBytes(memoryInfo.free) }}</p>
              <p><strong>可用:</strong> {{ formatBytes(memoryInfo.available) }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="m-t-20px">
      <!-- 磁盘使用情况 -->
      <el-col :span="12" :lg="12" :md="12" :sm="24" :xs="24">
        <el-card class="rounded-md dark:bg-black" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>磁盘使用情况</span>
            </div>
          </template>
          <div class="disk-usage">
            <div v-for="(disk, index) in diskInfo" :key="index" class="disk-item">
              <div class="disk-header">
                <span>{{ disk.filesystem }} ({{ disk.mountpoint }})</span>
              </div>
              <el-progress 
                :percentage="parseFloat(disk.usedPercent)" 
                :format="percent => `${percent}% - ${disk.used}/${disk.size}`"
                :color="getDiskColor(parseFloat(disk.usedPercent))" />
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 服务器状态 -->
      <el-col :span="12" :lg="12" :md="12" :sm="24" :xs="24">
        <el-card class="rounded-md dark:bg-black" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>泰拉瑞亚服务器状态</span>
            </div>
          </template>
          <div class="server-status">
            <div class="status-item">
              <span class="status-label">状态:</span>
              <el-tag :type="serverStatus === '运行中' ? 'success' : 'warning'">{{ serverStatus }}</el-tag>
            </div>
            <div class="status-item" v-if="serverStatus === '运行中'">
              <span class="status-label">在线玩家:</span>
              <span>{{ onlinePlayers }}</span>
            </div>
            <div class="status-item" v-if="serverStatus === '运行中'">
              <span class="status-label">运行时间:</span>
              <span>{{ uptime }}</span>
            </div>
            <div class="status-buttons">
              <el-button type="primary" @click="goToServerControl">服务器管理</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

// 资源使用率数据
const cpuUsage = ref(0);
const memoryUsage = ref(0);
const cpuInfo = reactive({
  cores: 0,
  loadAvg: [0, 0, 0]
});
const memoryInfo = reactive({
  total: 0,
  used: 0,
  free: 0,
  available: 0
});
const diskInfo = ref([]);
const serverStatus = ref('未运行');
const onlinePlayers = ref(0);
const uptime = ref('0分钟');

// 颜色计算
const cpuUsageColor = computed(() => {
  return getColorByPercentage(cpuUsage.value);
});

const memoryUsageColor = computed(() => {
  return getColorByPercentage(memoryUsage.value);
});

function getColorByPercentage(percentage) {
  if (percentage < 60) return '#67C23A';
  if (percentage < 80) return '#E6A23C';
  return '#F56C6C';
}

function getDiskColor(percentage) {
  return getColorByPercentage(percentage);
}

// 格式化字节数
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// 获取系统资源信息
async function fetchSystemResources() {
  try {
    const { data } = await axios.get('/api/system/resources');
    
    if (data.success) {
      cpuUsage.value = parseInt(data.cpu.usage);
      cpuInfo.cores = data.cpu.cores;
      cpuInfo.loadAvg = data.cpu.loadAvg;
      
      memoryUsage.value = parseInt(data.memory.usagePercent);
      memoryInfo.total = data.memory.total;
      memoryInfo.used = data.memory.used;
      memoryInfo.free = data.memory.free;
      memoryInfo.available = data.memory.available;
      
      diskInfo.value = data.disk;
    }
  } catch (error) {
    console.error('获取系统资源信息失败:', error);
  }
}

// 获取服务器状态
async function fetchServerStatus() {
  try {
    const { data } = await axios.get('/api/status');
    serverStatus.value = data.status;
    onlinePlayers.value = data.players || 0;
    uptime.value = data.uptime || '0分钟';
  } catch (error) {
    console.error('获取服务器状态失败:', error);
  }
}

// 跳转到服务器控制页面
function goToServerControl() {
  router.push('/terraria/server');
}

// 自动刷新数据
let refreshInterval;

onMounted(() => {
  fetchSystemResources();
  fetchServerStatus();

  // 每5秒刷新一次
  refreshInterval = setInterval(() => {
    fetchSystemResources();
    fetchServerStatus();
  }, 5000);
});

onUnmounted(() => {
  clearInterval(refreshInterval);
});
</script>

<style lang="scss" scoped>
.card-header {
  text-align: center;
  margin-bottom: 10px;
  
  h2 {
    margin-bottom: 5px;
  }
  
  p {
    margin: 0;
    color: #666;
  }
}

.chart-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .resource-info {
    flex: 0 0 auto;
  }
  
  .resource-details {
    flex: 1;
    margin-left: 20px;
    
    p {
      margin: 10px 0;
    }
  }
}

.progress-content {
  h3 {
    font-size: 24px;
    margin: 0;
  }
  
  p {
    margin: 5px 0 0;
    font-size: 14px;
    color: #666;
  }
}

.disk-usage {
  .disk-item {
    margin-bottom: 15px;
    
    .disk-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-weight: bold;
    }
  }
}

.server-status {
  .status-item {
    display: flex;
    margin-bottom: 15px;
    align-items: center;
    
    .status-label {
      min-width: 100px;
      font-weight: bold;
    }
  }
  
  .status-buttons {
    margin-top: 20px;
  }
}

.m-t-20px {
  margin-top: 20px;
}
</style>
