import { defineStore } from 'pinia';
import axios from 'axios';
import { API_BASE_URL, APP_VERSION } from '../config';
import { App } from '@capacitor/app';

export const useUpdateStore = defineStore('update', {
  state: () => ({
    currentVersion: APP_VERSION.VERSION, // 默认使用配置文件中的版本号
    latestVersion: null, // 最新版本
    updateAvailable: false, // 是否有更新
    updateInfo: null, // 更新信息
    isChecking: false, // 是否正在检查更新
    lastCheckTime: null, // 上次检查时间
    checkError: null, // 检查错误信息
    downloadProgress: 0, // 下载进度
    isDownloading: false, // 是否正在下载
    platform: 'android', // 默认平台为android
  }),
  
  actions: {
    // 检查更新
    async checkForUpdates(force = false) {
      // 如果不是强制检查且上次检查时间在一小时内，则跳过
      if (!force && this.lastCheckTime && (Date.now() - this.lastCheckTime < 3600000)) {
        return this.updateAvailable;
      }
      
      this.isChecking = true;
      this.checkError = null;
      
      try {
        // 所有设备都使用android平台
        const platform = 'android';
        const buildNumber = APP_VERSION.BUILD_NUMBER;
        
        this.platform = platform;
        
        // 调用API检查更新
        const response = await axios.get(`${API_BASE_URL}/api/updates/check`, {
          params: {
            version: this.currentVersion,
            platform: platform,
            buildNumber: buildNumber
          }
        });
        
        this.lastCheckTime = Date.now();
        
        if (response.data && response.data.hasUpdate) {
          this.latestVersion = response.data.latestVersion;
          this.updateInfo = response.data;
          this.updateAvailable = true;
          return true;
        } else {
          this.updateAvailable = false;
          return false;
        }
      } catch (error) {
        console.error('检查更新失败:', error);
        this.checkError = error.message || '检查更新失败';
        return false;
      } finally {
        this.isChecking = false;
      }
    },
    
    // 下载更新
    async downloadUpdate() {
      if (!this.updateAvailable || !this.updateInfo) {
        throw new Error('没有可用的更新');
      }
      
      this.isDownloading = true;
      this.downloadProgress = 0;
      
      try {
        // 获取后端返回的下载链接
        const downloadUrl = this.updateInfo.downloadUrl;
        
        if (!downloadUrl) {
          throw new Error('下载链接无效');
        }
        
        // 使用Capacitor的App.openUrl在系统浏览器中打开下载链接
        // 这在安卓端会正确处理APK下载
        await App.openUrl({ url: downloadUrl });
        
        return true;
      } catch (error) {
        console.error('下载更新失败:', error);
        throw error;
      } finally {
        this.isDownloading = false;
      }
    },
    
    // 设置当前版本
    setCurrentVersion(version) {
      this.currentVersion = version;
    },
  }
}); 