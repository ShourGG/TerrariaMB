<template>
  <div class="p-4px">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3 class="text-18px font-bold">下载游戏</h3>
          <el-button type="primary" @click="refreshStatus" size="small" :icon="Refresh">刷新状态</el-button>
        </div>
      </template>
      <el-collapse v-if="showStatus">
        <el-collapse-item title="下载与安装状态" name="1">
          <el-card class="status-card" shadow="never">
            <template #header>
              <div class="card-header">
                <h4>下载目录</h4>
                <el-tag>{{statusData.downloadDir?.fileCount || 0}} 个文件</el-tag>
              </div>
            </template>
            <div v-if="statusData.downloadDir?.files?.length">
              <el-table :data="statusData.downloadDir?.files" style="width: 100%">
                <el-table-column prop="name" label="文件名" />
                <el-table-column prop="size" label="大小" width="120" />
                <el-table-column prop="modTime" label="修改时间" width="200" />
              </el-table>
            </div>
            <el-empty v-else description="暂无下载文件" />
          </el-card>
          
          <el-row :gutter="20" class="mt-4">
            <el-col v-for="dir in statusData.installDirs" :key="dir.name" :span="8">
              <el-card class="status-card" shadow="never">
                <template #header>
                  <div class="card-header">
                    <h4>{{getDirectoryName(dir.name)}}</h4>
                    <el-tag :type="dir.exists ? 'success' : 'info'">
                      {{dir.exists ? dir.fileCount + ' 个文件' : '未创建'}}
                    </el-tag>
                  </div>
                </template>
                <div v-if="dir.files?.length">
                  <p v-for="(file, index) in dir.files" :key="index" class="file-item">
                    <el-icon><Document /></el-icon> {{file}}
                  </p>
                </div>
                <el-empty v-else description="目录为空" />
              </el-card>
            </el-col>
          </el-row>
        </el-collapse-item>
      </el-collapse>
      <div class="game-download-container">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 原版 -->
          <el-tab-pane label="原版" name="original">
            <el-card shadow="hover" class="version-card">
              <template #header>
                <div class="card-header">
                  <h4>泰拉瑞亚原版</h4>
                  <el-tag type="success">推荐</el-tag>
                </div>
              </template>
              <div class="version-content">
                <p class="text-14px text-gray-500 mb-4">官方原版泰拉瑞亚游戏，适合普通玩家。当前最新版本: v1.4.4.9</p>
                <el-image src="https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg" fit="cover" class="version-image"></el-image>
                
                <el-divider content-position="center">版本选择</el-divider>
                
                <div class="version-select">
                  <el-form :model="originalForm" label-position="top">
                    <el-form-item label="选择游戏版本">
                      <el-select v-model="originalForm.version" placeholder="请选择版本" style="width: 100%">
                        <el-option label="v1.4.4.9 (最新)" value="1449"></el-option>
                        <el-option label="v1.4.4.8" value="1448"></el-option>
                        <el-option label="v1.4.4.7" value="1447"></el-option>
                        <el-option label="v1.4.3.6" value="1436"></el-option>
                        <el-option label="v1.4.2.3" value="1423"></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="downloadGame('original')" style="width: 100%" size="large" :icon="Download">下载原版游戏</el-button>
                    </el-form-item>
                  </el-form>
                </div>
                
                <div class="download-links mt-4">
                  <h5 class="mb-2">直接下载链接:</h5>
                  <div class="direct-download-buttons">
                    <el-button type="success" :icon="Download" @click="directDownload('https://terraria.org/api/download/pc-dedicated-server/terraria-server-1449.zip')">
                      泰拉瑞亚服务器 v1.4.4.9
                    </el-button>
                    <el-button type="info" :icon="Link" @click="openLink('https://terraria.org/api/download/pc-dedicated-server/')">
                      查看所有版本
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-tab-pane>
          
          <!-- 模组版 -->
          <el-tab-pane label="模组版 (tModLoader)" name="modded">
            <el-card shadow="hover" class="version-card">
              <template #header>
                <div class="card-header">
                  <h4>泰拉瑞亚模组版 (tModLoader)</h4>
                  <el-tag type="warning">进阶</el-tag>
                </div>
              </template>
              <div class="version-content">
                <p class="text-14px text-gray-500 mb-4">官方模组加载器，可以安装各种模组扩展游戏内容。当前最新版本: v2025.04.3.0</p>
                <el-image src="https://cdn.akamai.steamstatic.com/steam/apps/1281930/header.jpg" fit="cover" class="version-image"></el-image>
                
                <el-divider content-position="center">版本选择</el-divider>
                
                <div class="version-select">
                  <el-form :model="moddedForm" label-position="top">
                    <el-form-item label="选择模组加载器版本">
                      <el-select v-model="moddedForm.version" placeholder="请选择版本" style="width: 100%">
                        <el-option-group label="最新稳定版">
                          <el-option label="v2025.04.3.0 (最新稳定版)" value="v2025.04.3.0"></el-option>
                        </el-option-group>
                        <el-option-group label="预览版">
                          <el-option label="v2025.05.2.0 (最新预览版)" value="v2025.05.2.0"></el-option>
                          <el-option label="v2025.04.2.2" value="v2025.04.2.2"></el-option>
                        </el-option-group>
                        <el-option-group label="历史版本">
                          <el-option label="v2025.04.2.1" value="v2025.04.2.1"></el-option>
                          <el-option label="v2025.04.2.0" value="v2025.04.2.0"></el-option>
                          <el-option label="v2025.03.3.1" value="v2025.03.3.1"></el-option>
                          <el-option label="v2025.03.3.0" value="v2025.03.3.0"></el-option>
                          <el-option label="v2025.03.2.12" value="v2025.03.2.12"></el-option>
                          <el-option label="v2025.03.2.11" value="v2025.03.2.11"></el-option>
                          <el-option label="v2025.03.2.9" value="v2025.03.2.9"></el-option>
                        </el-option-group>
                      </el-select>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="downloadGame('modded')" style="width: 100%" size="large" :icon="Download">下载模组版</el-button>
                    </el-form-item>
                  </el-form>
                </div>
                
                <div class="download-links mt-4">
                  <h5 class="mb-2">直接下载链接:</h5>
                  <div class="direct-download-buttons">
                    <el-button type="success" :icon="Download" @click="directDownload(`https://github.com/tModLoader/tModLoader/releases/download/${moddedForm.version}/tModLoader.zip`)">
                      tModLoader {{moddedForm.version}}
                    </el-button>
                    <el-button type="info" :icon="Link" @click="openLink('https://github.com/tModLoader/tModLoader/releases')">
                      查看所有版本
                    </el-button>
                  </div>
                </div>
                
                <el-alert
                  title="安装提示"
                  type="info"
                  description="手动安装：请将下载的tModLoader.zip压缩包文件放进Terraria/TMLserver下，然后执行【手动上传安装】"
                  show-icon
                  :closable="false"
                  class="mt-4"
                />
              </div>
            </el-card>
          </el-tab-pane>
          
          <!-- 插件版 -->
          <el-tab-pane label="插件版 (TShock)" name="plugin">
            <el-card shadow="hover" class="version-card">
              <template #header>
                <div class="card-header">
                  <h4>泰拉瑞亚插件版 (TShock)</h4>
                  <el-tag type="danger">专家</el-tag>
                </div>
              </template>
              <div class="version-content">
                <p class="text-14px text-gray-500 mb-4">TShock服务器，提供更多服务器管理功能和插件支持。适合开服使用。当前最新版本: v5.2</p>
                <el-image src="https://avatars.githubusercontent.com/u/4677545" fit="cover" class="version-image"></el-image>
                
                <el-divider content-position="center">版本选择</el-divider>
                
                <div class="version-select">
                  <el-form :model="pluginForm" label-position="top">
                    <el-form-item label="选择TShock版本">
                      <el-select v-model="pluginForm.version" placeholder="请选择版本" style="width: 100%">
                        <el-option label="v5.2 for 1.4.4.9 (最新)" value="TShock-5.2-for-Terraria-1.4.4.9-linux-x64-Release.zip"></el-option>
                        <el-option label="v5.1.3 for 1.4.4.8" value="TShock-5.1.3-for-Terraria-1.4.4.8-linux-x64-Release.zip"></el-option>
                        <el-option label="v5.0 for 1.4.4.7" value="TShock-5.0-for-Terraria-1.4.4.7-linux-x64-Release.zip"></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="downloadGame('plugin')" style="width: 100%" size="large" :icon="Download">下载插件版</el-button>
                    </el-form-item>
                  </el-form>
                </div>
                
                <div class="download-links mt-4">
                  <h5 class="mb-2">直接下载链接:</h5>
                  <div class="direct-download-buttons">
                    <el-button type="success" :icon="Download" @click="directDownload('https://github.com/Pryaxis/TShock/releases/download/v5.2/TShock-5.2-for-Terraria-1.4.4.9-linux-x64-Release.zip')">
                      TShock v5.2
                    </el-button>
                    <el-button type="info" :icon="Link" @click="openLink('https://github.com/Pryaxis/TShock/releases/latest')">
                      查看最新版本
                    </el-button>
                  </div>
                </div>
                
                <el-alert
                  title="安装提示"
                  type="info"
                  description="手动安装：请将下载的压缩包文件放进Terraria/TSserver下，然后执行【手动上传安装】"
                  show-icon
                  :closable="false"
                  class="mt-4"
                />
              </div>
            </el-card>
          </el-tab-pane>
          
          <!-- 手动上传 -->
          <el-tab-pane label="手动上传安装" name="manual">
            <el-card shadow="hover" class="version-card">
              <template #header>
                <div class="card-header">
                  <h4>手动上传安装</h4>
                </div>
              </template>
              <div class="version-content">
                <p class="text-14px text-gray-500 mb-4">如果您已经下载了游戏文件，可以通过此功能上传并安装</p>
                
                <el-upload
                  class="upload-demo"
                  drag
                  action="#"
                  :auto-upload="false"
                  :on-change="handleFileChange"
                  :limit="1"
                >
                  <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                  <div class="el-upload__text">
                    拖拽文件到此处，或 <em>点击上传</em>
                  </div>
                  <template #tip>
                    <div class="el-upload__tip">
                      请上传zip格式的游戏文件，大小不超过500MB
                    </div>
                  </template>
                </el-upload>
                
                <div class="mt-4">
                  <el-form :model="manualForm" label-position="top">
                    <el-form-item label="选择安装类型">
                      <el-select v-model="manualForm.type" placeholder="请选择安装类型" style="width: 100%">
                        <el-option label="原版游戏" value="original"></el-option>
                        <el-option label="模组版 (tModLoader)" value="modded"></el-option>
                        <el-option label="插件版 (TShock)" value="plugin"></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="uploadGame" style="width: 100%" size="large" :icon="Upload" :disabled="!manualForm.file">上传并安装</el-button>
                    </el-form-item>
                  </el-form>
                </div>
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
        
        <el-divider content-position="center">游戏资源</el-divider>
        
        <el-row :gutter="20" class="mt-4">
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <h4>官方资源</h4>
                </div>
              </template>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="官方网站">
                  <el-link type="primary" href="https://terraria.org/" target="_blank">https://terraria.org/</el-link>
                </el-descriptions-item>
                <el-descriptions-item label="Steam商店页面">
                  <el-link type="primary" href="https://store.steampowered.com/app/105600/Terraria/" target="_blank">https://store.steampowered.com/app/105600/Terraria/</el-link>
                </el-descriptions-item>
                <el-descriptions-item label="官方Wiki">
                  <el-link type="primary" href="https://terraria.wiki.gg/" target="_blank">https://terraria.wiki.gg/</el-link>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <h4>社区资源</h4>
                </div>
              </template>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="中文Wiki">
                  <el-link type="primary" href="https://terraria.wiki.gg/zh/wiki/Terraria_Wiki" target="_blank">https://terraria.wiki.gg/zh/wiki/Terraria_Wiki</el-link>
                </el-descriptions-item>
                <el-descriptions-item label="模组数据库">
                  <el-link type="primary" href="https://steamcommunity.com/workshop/browse/?appid=1281930" target="_blank">Steam创意工坊</el-link>
                </el-descriptions-item>
                <el-descriptions-item label="中文论坛">
                  <el-link type="primary" href="https://www.terraria-zh.com/" target="_blank">https://www.terraria-zh.com/</el-link>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 添加手动解压功能 -->
      <el-card class="mt-4">
        <template #header>
          <div class="card-header">
            <span>下载管理与手动解压</span>
            <el-button type="primary" @click="refreshDownloadStatus">刷新下载状态</el-button>
          </div>
        </template>
        
        <div v-if="downloadFiles.length > 0">
          <h5>已下载文件列表：</h5>
          <el-table :data="downloadFiles" style="width: 100%">
            <el-table-column prop="name" label="文件名" />
            <el-table-column prop="size" label="大小" width="120" />
            <el-table-column prop="modTime" label="修改时间" width="180" />
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button size="small" type="success" @click="handleManualExtract(scope.row)">
                  手动解压
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty v-else description="暂无下载文件" />
        
        <el-alert
          title="手动解压说明"
          type="info"
          description="如果自动解压失败，您可以尝试手动解压。系统会根据文件名自动识别服务器类型并解压到对应目录。"
          show-icon
          :closable="false"
          class="mt-4"
        />
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="downloadPage">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled, Download, Upload, Link, Refresh, Document } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 当前激活的标签页，根据路由参数设置
const activeTab = computed(() => {
  const path = route.path;
  if (path.includes('/vanilla')) return 'original';
  if (path.includes('/modded')) return 'modded';
  if (path.includes('/plugin')) return 'plugin';
  return 'original'; // 默认显示原版
});

// 原版表单
const originalForm = reactive({
  version: '1449'
});

// 模组版表单
const moddedForm = reactive({
  version: 'v2025.04.3.0'
});

// 插件版表单
const pluginForm = reactive({
  version: 'TShock-5.2-for-Terraria-1.4.4.9-linux-x64-Release.zip'
});

// 手动上传表单
const manualForm = reactive({
  type: 'original',
  file: null as any
});

// 新增 - 下载状态数据
const showStatus = ref(false);
const statusData = reactive({
  downloadDir: { path: '', fileCount: 0, files: [] as any[] },
  installDirs: [] as any[]
});

// 下载文件列表
const downloadFiles = ref([]);

// 获取下载状态
const refreshStatus = () => {
  fetch('/api/download-status')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        Object.assign(statusData, data);
        showStatus.value = true;
      } else {
        ElMessage({
          message: `获取状态失败: ${data.message || '未知错误'}`,
          type: 'error'
        });
      }
    })
    .catch(error => {
      ElMessage({
        message: `获取状态出错: ${error.message}`,
        type: 'error'
      });
    });
};

// 目录名称美化
const getDirectoryName = (dirName: string) => {
  switch(dirName) {
    case 'server': return '原版服务器';
    case 'TMLserver': return '模组版服务器';
    case 'TSserver': return '插件版服务器';
    default: return dirName;
  }
};

// 刷新下载状态
const refreshDownloadStatus = () => {
  fetch('/api/download-status')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        downloadFiles.value = data.downloadDir.files || [];
      } else {
        ElMessage({
          message: `获取下载状态失败: ${data.message || '未知错误'}`,
          type: 'error'
        });
      }
    })
    .catch(error => {
      ElMessage({
        message: `获取下载状态出错: ${error.message}`,
        type: 'error'
      });
    });
};

// 在组件挂载时获取一次状态
onMounted(() => {
  refreshStatus();
  refreshDownloadStatus();
});

// 下载游戏函数
const downloadGame = (gameType: string) => {
  let downloadMessage = '';
  let downloadUrl = '';
  let fileName = '';
  
  switch(gameType) {
    case 'original':
      fileName = `terraria-server-${originalForm.version}.zip`;
      downloadMessage = `开始下载泰拉瑞亚原版 v${originalForm.version.replace(/(\d)(\d)(\d)(\d)/, '$1.$2.$3.$4')}`;
      downloadUrl = `https://terraria.org/api/download/pc-dedicated-server/${fileName}`;
      break;
    case 'modded':
      fileName = `tModLoader-${moddedForm.version}.zip`;
      downloadMessage = `开始下载tModLoader ${moddedForm.version}`;
      downloadUrl = `https://github.com/tModLoader/tModLoader/releases/download/${moddedForm.version}/tModLoader.zip`;
      break;
    case 'plugin':
      fileName = pluginForm.version;
      downloadMessage = `开始下载TShock ${pluginForm.version}`;
      downloadUrl = `https://github.com/Pryaxis/TShock/releases/download/v${pluginForm.version.split('-')[1]}/TShock-${pluginForm.version.split('-')[1]}-for-Terraria-${pluginForm.version.split('-')[3]}-linux-x64-Release.zip`;
      break;
    default:
      downloadMessage = '开始下载...';
  }
  
  // 通过API调用后端进行下载并解压
  fetch('/api/download-game', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: downloadUrl,
      fileName: fileName,
      type: gameType
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      ElMessage({
        message: `${downloadMessage}，下载任务已开始。下载完成后会自动解压安装。`,
        type: 'success'
      });
    } else {
      ElMessage({
        message: `下载失败: ${data.message || '未知错误'}`,
        type: 'error'
      });
    }
  })
  .catch(error => {
    ElMessage({
      message: `下载出错: ${error.message}`,
      type: 'error'
    });
  });
};

// 处理文件变更
const handleFileChange = (file: any) => {
  manualForm.file = file.raw || file;
};

// 上传游戏文件
const uploadGame = () => {
  if (!manualForm.file) {
    ElMessage.warning('请先选择文件');
    return;
  }
  
  // 这里只是显示消息，实际应该处理上传逻辑
  ElMessage({
    message: `正在上传 ${manualForm.file.name || '未知文件'} 并安装为${
      manualForm.type === 'original' ? '原版游戏' : 
      manualForm.type === 'modded' ? '模组版' : '插件版'
    }`,
    type: 'success'
  });
};

// 直接下载
const directDownload = (url: string) => {
  const fileName = url.substring(url.lastIndexOf('/') + 1);
  const gameType = url.includes('tModLoader') ? 'modded' : 
                   url.includes('TShock') ? 'plugin' : 'original';
  
  // 通过API调用后端进行下载并解压
  fetch('/api/download-game', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: url,
      fileName: fileName,
      type: gameType
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      ElMessage({
        message: `下载任务已开始。下载完成后会自动解压安装。`,
        type: 'success'
      });
    } else {
      ElMessage({
        message: `下载失败: ${data.message || '未知错误'}`,
        type: 'error'
      });
    }
  })
  .catch(error => {
    ElMessage({
      message: `下载出错: ${error.message}`,
      type: 'error'
    });
  });
};

// 打开链接
const openLink = (url: string) => {
  // 如果是版本页面，使用本地缓存版本进行显示
  if (url.includes('tModLoader/releases') || url.includes('TShock/releases')) {
    ElMessage({
      message: '正在加载版本信息...',
      type: 'info'
    });
    
    fetch('/api/game-versions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // 显示版本信息对话框，而不是跳转到外部
        ElMessageBox.alert(
          `${url.includes('tModLoader') ? 'tModLoader' : 'TShock'} 可用版本：\n\n${data.versions.join('\n')}`, 
          '版本信息',
          {
            confirmButtonText: '确定'
          }
        );
      } else {
        // 如果获取失败，则回退到外部打开
        window.open(url, '_blank');
      }
    })
    .catch(error => {
      // 如果出错，则回退到外部打开
      window.open(url, '_blank');
    });
  } else {
    // 其他链接正常打开
    window.open(url, '_blank');
  }
};

// 手动解压处理
const handleManualExtract = (file) => {
  ElMessageBox.confirm(
    `确定要手动解压文件 "${file.name}" 吗？系统将根据文件名自动识别服务器类型。`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      const userDir = '/home/泰拉瑞亚'; // Linux环境路径
      const filePath = `${userDir}/Terraria/Downloads/${file.name}`;
      
      // 调用手动解压API
      fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: filePath
        })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            ElMessage({
              message: `解压成功，服务器类型: ${data.serverType}`,
              type: 'success'
            });
          } else {
            ElMessage({
              message: `解压失败: ${data.message || '未知错误'}`,
              type: 'error'
            });
          }
        })
        .catch(error => {
          ElMessage({
            message: `解压出错: ${error.message}`,
            type: 'error'
          });
        });
    })
    .catch(() => {
      // 用户取消操作
    });
};
</script>

<style lang="scss" scoped>
.game-download-container {
  margin-top: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-card {
  margin-bottom: 20px;
  
  .version-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 4px;
    margin-bottom: 15px;
  }
  
  .version-content {
    padding: 10px 0;
  }
  
  .version-select {
    margin: 15px 0;
  }
}

// 新增状态卡片样式
.status-card {
  margin-bottom: 15px;
  
  .file-item {
    margin: 6px 0;
    display: flex;
    align-items: center;
    
    .el-icon {
      margin-right: 8px;
      color: #409EFF;
    }
  }
}

// 为el-table添加样式
:deep(.el-table) {
  font-size: 0.9rem;
  
  .el-table__header {
    th {
      background-color: #f5f7fa;
    }
  }
  
  .el-table__row {
    &:hover {
      background-color: #f0f9ff;
    }
  }
}

.download-links {
  border-top: 1px dashed #eee;
  padding-top: 15px;
}

.direct-download-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  
  .el-button {
    flex: 1;
  }
}

// 强调下载按钮
:deep(.el-button--primary) {
  font-weight: bold;
  padding: 12px 20px;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
}

// 添加动画效果
:deep(.el-button--success) {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}
</style> 