<template>
  <el-row class="min-h-screen">
    <el-col :lg="16" :md="12" :sm="0" :xs="0" class="bg-[--el-color-primary] flex items-center justify-center">
      <div>
        <el-image v-if="!isScreen" class="w-400px h-360px mb-50px" :src="bg" />
        <div class="font-bold text-3xl text-light-50 mb-6px text-center">
          欢迎{{ isRegister ? '注册' : '登录' }} {{ settings.loginTitle || "泰拉瑞亚服务器管理系统" }}
        </div>
        <div class="text-gray-200 text-lg text-center">{{ isRegister ? '首次使用需要创建账号' : '或许我们只是差点运气' }}</div>
      </div>
      <!-- 删除备案号 -->
    </el-col>
    <el-col :lg="8" :md="12" :sm="24" :xs="24" class="dark:bg-#121212 bg-gray-100 flex items-center justify-center flex-col">
      <div class="flex items-center">
        <el-image class="rounded-full w-36px h-36px" :src="logo" />
        <div class="ml-6px font-bold text-xl">{{ settings.loginTitle || "泰拉瑞亚服务器管理系统" }}</div>
      </div>
      <div class="flex items-center space-x-3 text-gray-400 mt-16px mb-16px">
        <span class="h-1px w-16 bg-gray-300 inline-block"></span>
        <span class="text-center">{{ isRegister ? '账号注册' : '账号密码登录' }}</span>
        <span class="h-1px w-16 bg-gray-300 inline-block"></span>
      </div>
      
      <!-- 登录表单 -->
      <el-form v-if="!isRegister" ref="loginFormRef" :model="loginForm" :rules="loginRules">
        <el-form-item prop="userName">
          <el-input type="text" placeholder="请输入用户名" :suffix-icon="User" v-model="loginForm.loginName" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input type="password" placeholder="请输入密码" show-password :suffix-icon="Lock" v-model="loginForm.password" />
        </el-form-item>
        <el-form-item prop="securityCode">
          <el-input
            type="text"
            placeholder="请输入验证码"
            :suffix-icon="Open"
            v-model="loginForm.securityCode"
            @keydown.enter="handleKoiLogin"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-image class="w-100px h-30px" :src="loginForm.captchaPicture" @click="handleCaptcha" />
          <el-button text size="small" class="ml-6px" @click="handleCaptcha">
            <div class="text-gray-400 hover:text-#8B5CF6 select-none">看不清，换一张</div>
          </el-button>
        </el-form-item>
        <!-- 登录按钮 -->
        <el-form-item>
          <el-button type="primary" v-if="!loading" class="w-245px bg-[--el-color-primary]" round @click="handleKoiLogin"
            >登录</el-button
          >
          <el-button type="primary" v-if="loading" class="w-245px bg-[--el-color-primary]" round :loading="loading"
            >登录中</el-button
          >
        </el-form-item>
      </el-form>
      
      <!-- 注册表单 -->
      <el-form v-else ref="registerFormRef" :model="registerForm" :rules="registerRules">
        <el-form-item prop="username">
          <el-input type="text" placeholder="请输入用户名" :suffix-icon="User" v-model="registerForm.username" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input type="password" placeholder="请输入密码" show-password :suffix-icon="Lock" v-model="registerForm.password" />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input 
            type="password" 
            placeholder="请确认密码" 
            show-password 
            :suffix-icon="Lock" 
            v-model="registerForm.confirmPassword" 
          />
        </el-form-item>
        <!-- 注册按钮 -->
        <el-form-item>
          <el-button type="primary" v-if="!loading" class="w-245px bg-[--el-color-primary]" round @click="handleRegister"
            >注册</el-button
          >
          <el-button type="primary" v-if="loading" class="w-245px bg-[--el-color-primary]" round :loading="loading"
            >注册中</el-button
          >
        </el-form-item>
      </el-form>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { User, Lock, Open } from "@element-plus/icons-vue";
// @ts-ignore
import { ref, reactive, onMounted, onUnmounted } from "vue";

import type { FormInstance, FormRules } from "element-plus";
import { koiMsgError, koiMsgSuccess } from "@/utils/koi.ts";
import { useRouter } from "vue-router";
// import { koiLogin, getCaptcha } from "@/api/system/login/index.ts";
import authLogin from "@/assets/json/authLogin.json";
import useUserStore from "@/stores/modules/user.ts";
import useKeepAliveStore from "@/stores/modules/keepAlive.ts";
import { HOME_URL } from "@/config/index.ts";
import { initDynamicRouter } from "@/routers/modules/dynamicRouter.ts";
import useTabsStore from "@/stores/modules/tabs.ts";
import { getAssets } from "@/utils/index.ts";
import settings from "@/settings";
import { hasRegisteredUser, saveUserData, validateUserLogin } from "@/utils/user-storage";
/** 适配移动端开始 */
import { useScreenStore } from "@/hooks/screen/index.ts";
// 获取当前为[移动端、IPad、PC端]仓库，阔以使用 watchEffect(() => {}) 进行监听。
const { isScreen } = useScreenStore();
/** 适配移动端结束 */

const userStore = useUserStore();
const tabsStore = useTabsStore();
const keepAliveStore = useKeepAliveStore();
const router = useRouter();

// 注册/登录状态切换
const isRegister = ref(false);

/** 用户登录代码 */
const logo = getAssets("images/logo/logo.webp");
const bg = getAssets("images/login/bg.png");
const loginFormRef = ref<FormInstance>();
const registerFormRef = ref<FormInstance>();
const loading = ref(false);

interface ILoginUser {
  loginName: string;
  password: string | number;
  securityCode: string | number;
  codeKey: string | number;
  captchaPicture: any;
}

interface IRegisterUser {
  username: string;
  password: string;
  confirmPassword: string;
}

// 组件挂载时检查是否有注册用户
onMounted(async () => {
  // 获取验证码
  handleCaptcha();
  
  // 检查是否有注册用户，没有则显示注册表单
  const userExists = await hasRegisteredUser();
  isRegister.value = !userExists;
});

const loginForm = reactive<ILoginUser>({
  loginName: "",
  password: "",
  securityCode: "1234",
  codeKey: "",
  captchaPicture: ""
});

const registerForm = reactive<IRegisterUser>({
  username: "",
  password: "",
  confirmPassword: ""
});

// 验证确认密码与密码一致
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请确认密码'));
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const loginRules = reactive<FormRules<ILoginUser>>({
  loginName: [{ required: true, message: "用户名不能为空", trigger: "blur" }],
  password: [{ required: true, message: "密码不能为空", trigger: "blur" }],
  securityCode: [{ required: true, message: "验证码不能为空", trigger: "blur" }]
});

const registerRules = reactive<FormRules>({
  username: [
    { required: true, message: "用户名不能为空", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度在 3 到 20 个字符", trigger: "blur" }
  ],
  password: [
    { required: true, message: "密码不能为空", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在 6 到 20 个字符", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" }
  ]
});

/** 获取验证码 */
const handleCaptcha = async () => {
  // try {
  //   const res: any = await getCaptcha();
  //   loginForm.codeKey = res.data.codeKey;
  //   loginForm.captchaPicture = res.data.captchaPicture;
  // } catch (error) {
  //   console.log(error);
  //   koiMsgError("验证码获取失败🌻");
  // }
};

// 注册处理函数
const handleRegister = async () => {
  if (!registerFormRef.value) return;
  
  registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      
      try {
        // 保存用户信息到文件系统
        const userData = {
          username: registerForm.username,
          password: registerForm.password
        };
        
        const success = await saveUserData(userData);
        
        if (success) {
          // 注册成功后自动设置登录表单的用户名
          loginForm.loginName = registerForm.username;
          
          // 显示成功消息
          koiMsgSuccess("注册成功，请登录！");
          
          // 切换到登录表单
          isRegister.value = false;
        } else {
          koiMsgError("注册失败，请重试");
        }
      } catch (error) {
        console.error("注册失败", error);
        koiMsgError("注册过程中出现错误，请重试");
      } finally {
        loading.value = false;
      }
    }
  });
};

/** 登录 */
const handleKoiLogin = () => {
  if (!loginFormRef.value) return;
  
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      
      try {
        // 验证用户登录
        const isValid = await validateUserLogin(loginForm.loginName as string, loginForm.password as string);
        
        if (isValid) {
          // 设置token
        userStore.setToken(authLogin.data.tokenValue);
          
          // 添加动态路由和用户信息
        await initDynamicRouter();

          // 清空tabs数据和缓存数据
        tabsStore.setTab([]);
        keepAliveStore.setKeepAliveName([]);

          // 显示登录成功消息
          koiMsgSuccess("登录成功！");
          
          // 跳转到首页
        router.push(HOME_URL);
        } else {
          koiMsgError("用户名或密码错误");
        }
      } catch (error) {
        console.error("登录失败", error);
        koiMsgError("登录失败，请重试");
      } finally {
            loading.value = false;
      }
    } else {
      koiMsgError("表单验证失败，请检查输入");
    }
  });
};
</script>

<style lang="scss" scoped>
/** 自定义样式 */
:deep(.el-input__wrapper) {
  border-radius: 20px;
}
:deep(.el-button) {
  border-radius: 20px;
}
</style>
