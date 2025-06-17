<template>
  <div :class="['breadcrumb-box', 'mask-image']">
    <el-breadcrumb :separator-icon="ArrowRight">
      <transition-group name="breadcrumb">
        <el-breadcrumb-item v-for="(item, index) in breadcrumbList" :key="item.path">
          <div
            class="el-breadcrumb__inner is-link"
            :class="{ 'item-no-icon': !item.meta.icon }"
            @click="handleBreadcrumb(item, index)"
          >
            <KoiGlobalIcon class="breadcrumb-icon" v-if="item.meta.icon" :name="item.meta.icon" size="16"></KoiGlobalIcon>
            <span class="breadcrumb-title">{{ item.meta.title }}</span>
          </div>
        </el-breadcrumb-item>
      </transition-group>
    </el-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { HOME_URL } from "@/config/index.ts";
import { useRoute, useRouter } from "vue-router";
import { ArrowRight } from "@element-plus/icons-vue";
import useAuthStore from "@/stores/modules/auth.ts";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const breadcrumbList = computed(() => {
  try {
    // 确保route.matched有元素
    if (!route.matched || route.matched.length === 0) {
      return [{ path: HOME_URL, meta: { icon: "HomeFilled", title: "首页" } }];
    }
    
    // 获取面包屑数据，如果为空则提供默认数组
    let breadcrumbData = authStore.getBreadcrumbList[route.matched[route.matched.length - 1].path] || [];
    
    // 如果数据为空，返回默认的首页
    if (!breadcrumbData || breadcrumbData.length === 0) {
      return [{ path: HOME_URL, meta: { icon: "HomeFilled", title: "泰拉瑞亚服务器" } }];
    }
    
  // 不需要首页面包屑可删除以下判断
    if (breadcrumbData[0] && breadcrumbData[0].path !== HOME_URL) {
      breadcrumbData = [{ path: HOME_URL, meta: { icon: "HomeFilled", title: "泰拉瑞亚服务器" } }, ...breadcrumbData];
  }
  return breadcrumbData;
  } catch (error) {
    console.error("面包屑错误:", error);
    return [{ path: HOME_URL, meta: { icon: "HomeFilled", title: "泰拉瑞亚服务器" } }];
  }
});

// 点击面包屑
const handleBreadcrumb = (item: any, index: number) => {
  if (index !== breadcrumbList.value.length - 1) router.push(item.path);
};
</script>

<style scoped lang="scss">
/* breadcrumb-transform 面包屑动画 */
.breadcrumb-enter-active {
  transition: all 0.2s;
}
.breadcrumb-enter-from,
.breadcrumb-leave-active {
  opacity: 0;
  transform: translateX(10px);
}

.breadcrumb-box {
  display: flex;
  align-items: center;
  margin-left: 20px;
  overflow: hidden;
  user-select: none;
  .el-breadcrumb {
    line-height: 15px;
    white-space: nowrap;
    .el-breadcrumb__item {
      position: relative;
      display: inline-block;
      float: none;
      .breadcrumb-title {
        font-weight: 600;
      }
      .item-no-icon {
        transform: translateY(-3px);
      }
      .el-breadcrumb__inner {
        display: inline-flex;
        &.is-link {
          color: var(--el-header-text-color);
          &:hover {
            color: var(--el-color-primary);
          }
        }
        .breadcrumb-icon {
          margin-top: 1px;
          margin-right: 6px;
          font-size: 16px;
        }
        .breadcrumb-title {
          margin-top: 2px;
        }
      }
      &:last-child .el-breadcrumb__inner,
      &:last-child .el-breadcrumb__inner:hover {
        color: var(--el-header-text-color-regular);
      }
      :deep(.el-breadcrumb__separator) {
        transform: translateY(-1px);
      }
    }
  }
}
/* 右侧向左侧移动，面包屑模糊 */
.mask-image {
  padding-right: 50px;
  mask-image: linear-gradient(90deg, #000000 0%, #000000 calc(100% - 50px), transparent);
}
</style>
