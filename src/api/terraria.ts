import axios from 'axios';

/**
 * 获取服务器状态
 */
export const getServerStatus = () => {
  return axios.get('/api/status');
};

/**
 * 启动服务器
 * @param data 服务器参数
 */
export const startServer = (data: {
  serverType: string;
  worldName: string;
  playerCount: number;
  port: number;
}) => {
  return axios.post('/api/start', data);
};

/**
 * 停止服务器
 */
export const stopServer = () => {
  return axios.post('/api/stop');
};

/**
 * 向服务器发送命令
 * @param command 命令
 */
export const sendCommand = (command: string) => {
  return axios.post('/api/command', { command });
};

/**
 * 获取系统资源信息
 */
export const getSystemInfo = () => {
  return axios.get('/api/system');
}; 