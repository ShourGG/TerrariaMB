<template>
  <div class="p-4px">
    <el-row :gutter="20">
      <el-col :span="6" :xs="24">
        <el-card>
          <div class="text-13px koi-card">
            <div class="flex justify-center">
              <KoiUploadImage v-model:imageUrl="mine.avatar">
                <template #content>
                  <el-icon><Avatar /></el-icon>
                  <span>请上传头像</span>
                </template>
              </KoiUploadImage>
            </div>
            <div class="flex justify-between mt-20px p-y-12px">
              <div class="flex items-center">
                <el-icon size="15"> <UserFilled /> </el-icon>
                <div class="p-l-2px">账号</div>
              </div>
              <div v-text="mine.userName"></div>
            </div>
            <!-- 其他个人信息已隐藏 -->
          </div>
        </el-card>
      </el-col>
      <el-col :span="18" :xs="24">
        <el-card :body-style="{ 'padding-top': '6px' }">
          <div class="card-header mb-2">
            <h3 class="text-18px font-bold">修改密码</h3>
          </div>
              <el-form ref="pwdFormRef" :rules="pwdRules" :model="pwdForm" label-width="80px" status-icon>
                <el-row>
                  <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                    <el-form-item label="密码" prop="password">
                      <el-input v-model="pwdForm.password" placeholder="请输入旧密码" show-password clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                    <el-form-item label="新密码" prop="newPassword">
                      <el-input v-model="pwdForm.newPassword" placeholder="请输入新密码" show-password clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="{ span: 24 }" :sm="{ span: 24 }">
                    <el-form-item label="确认密码" prop="confirmPassword">
                      <el-input v-model="pwdForm.confirmPassword" placeholder="请输入确认密码" show-password clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="{ span: 24 }" :sm="{ span: 24 }" class="mt-6px">
                    <el-form-item>
                      <el-button type="primary" plain @click="handlePwdSave">保存</el-button>
                      <el-button type="danger" plain @click="resetPwdForm">重置</el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts" name="personagePage">
import { ref, reactive, onMounted } from "vue";
import { koiMsgError, koiMsgSuccess } from "@/utils/koi.ts";
import { getRegisteredUser } from "@/utils/user-storage";

// 个人信息
const mine = ref({
  avatar: "https://pic4.zhimg.com/v2-702a23ebb518199355099df77a3cfe07_b.webp",
  userName: ""
});

// 组件挂载时获取用户信息
onMounted(async () => {
  try {
    // 获取用户信息
    const userData = await getRegisteredUser();
    if (userData && userData.username) {
      mine.value.userName = userData.username;
    } else {
      mine.value.userName = "未知账号";
    }
  } catch (error) {
    console.error("获取用户信息失败", error);
    mine.value.userName = "获取失败";
    }
  });

/** 修改密码  */
// form表单Ref
const pwdFormRef = ref<any>();
// form表单
let pwdForm = ref<any>({
  password: "",
  newPassword: "",
  confirmPassword: ""
});

/** 清空表单数据 */
const resetPwdForm = () => {
  pwdForm.value = {
    password: "",
    newPassword: "",
    confirmPassword: ""
  };
};

/** 表单规则 */
const pwdRules = reactive({
  password: [{ required: true, message: "请输入旧密码", trigger: "change" }],
  newPassword: [{ required: true, message: "请输入新密码", trigger: "change" }],
  confirmPassword: [{ required: true, message: "请输入确认密码", trigger: "change" }]
});

/** 保存 */
const handlePwdSave = () => {
  if (!pwdFormRef.value) return;
  (pwdFormRef.value as any).validate(async (valid: any) => {
    if (valid) {
      koiMsgSuccess("保存成功🌻");
    } else {
      koiMsgError("验证失败，请检查填写内容🌻");
    }
  });
};
</script>

<style lang="scss" scoped>
.koi-card {
  color: #000000;
  @apply dark:c-#E5EAF3;
}
</style>
