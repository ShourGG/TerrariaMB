<template>
  <!-- 有下级，用el-sub-menu，无下级用el-menu-item -->
  <template v-for="item in menuList" :key="item.path">
    <!-- 非叶子节点 -->
    <el-sub-menu v-if="item.children?.length" :index="item.path">
      <template #title>
        <KoiGlobalIcon v-if="item.meta.icon" :name="item.meta.icon" size="18"></KoiGlobalIcon>
        <span v-text="item.meta.title"></span>
      </template>
      <HorizontalSubMenu :menuList="item.children" />
    </el-sub-menu>
    <!-- 叶子节点[功能节点] -->
    <el-menu-item v-else :index="item.path" @click="handleMenuRouter(item)">
      <KoiGlobalIcon v-if="item.meta.icon" :name="item.meta.icon" size="18"></KoiGlobalIcon>
      <template #title>
        <span v-text="item.meta.title"></span>
      </template>
    </el-menu-item>
  </template>
</template>

<script setup lang="ts">
import HorizontalSubMenu from "@/layouts/components/Menu/HorizontalSubMenu.vue";
import { koiMsgWarning } from "@/utils/koi.ts";
import { useRouter } from "vue-router";
const router = useRouter();
// 获取父组件传递过来的数据
defineProps(["menuList"]);

/* 打开标签页 或 外部链接 */
const handleMenuRouter = (value: any) => {
  if (value.meta?.isLink) {
    if (/^https?:\/\//.test(value.meta?.isLink)) {
      return window.open(value.meta.isLink, "_blank");
    } else {
      koiMsgWarning("非正确链接地址，禁止跳转");
      return;
    }
  }
  router.push(value.path);
};
</script>

<style lang="scss" scoped>
.el-menu-item {
  user-select: none;
  --el-menu-item-height: $aside-menu-height;
  &.is-active {
    color: #fff !important;
    background-color: var(--el-color-primary) !important;
  }
}
</style>
