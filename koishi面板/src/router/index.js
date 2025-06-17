import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: '首页',
      icon: 'House'
    }
  },
  {
    path: '/server',
    name: 'server',
    component: () => import('../views/ServerView.vue'),
    meta: {
      title: '服务器管理',
      icon: 'Monitor'
    }
  },
  {
    path: '/system',
    name: 'system',
    component: () => import('../views/SystemControl.vue'),
    meta: {
      title: '系统控制',
      icon: 'Setting'
    }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
    meta: {
      title: '关于',
      icon: 'InfoFilled'
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router; 