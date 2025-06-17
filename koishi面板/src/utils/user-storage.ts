import { koiMsgError } from './koi';
import axios from 'axios';

// 用户数据接口
interface UserData {
  username: string;
  password: string;
}

// 用户数据存储路径 - 使用相对路径，由Vite代理转发
const USER_STORAGE_API = '/api/user/storage';
const USER_VALIDATE_API = '/api/user/storage/validate';

// 创建一个专用axios实例，确保使用当前主机的API
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 5000
});

/**
 * 从文件中读取已注册的用户信息
 * @returns {Promise<UserData|null>} 返回用户信息对象，如果不存在则返回null
 */
export const getRegisteredUser = async (): Promise<UserData | null> => {
  try {
    const response = await apiClient.get('/user/storage');
    return response.data;
  } catch (error) {
    console.error('读取用户信息失败:', error);
    return null;
  }
};

/**
 * 检查是否存在已注册用户
 * @returns {Promise<boolean>} 是否存在已注册用户
 */
export const hasRegisteredUser = async (): Promise<boolean> => {
  const userData = await getRegisteredUser();
  return !!userData && !!userData.username;
};

/**
 * 保存用户信息到文件
 * @param {UserData} userData - 要保存的用户数据
 * @returns {Promise<boolean>} 保存是否成功
 */
export const saveUserData = async (userData: UserData): Promise<boolean> => {
  try {
    await apiClient.post('/user/storage', userData);
    return true;
  } catch (error) {
    console.error('保存用户信息失败:', error);
    koiMsgError('保存用户信息失败');
    return false;
  }
};

/**
 * 验证用户登录信息
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<boolean>} 验证是否通过
 */
export const validateUserLogin = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await apiClient.post('/user/storage/validate', { username, password });
    return response.data.valid;
  } catch (error) {
    console.error('验证用户失败:', error);
    return false;
  }
}; 