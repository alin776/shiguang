import { Network } from '@capacitor/network';
import { ElMessage } from 'element-plus';
import { Capacitor } from '@capacitor/core';

/**
 * 网络状态监控器
 * 用于实时监控网络状态变化并提供网络状态信息
 */
class NetworkMonitor {
  constructor() {
    this.isConnected = navigator.onLine;
    this.listeners = [];
    this.lastStatus = null;
    this.initialized = false;
  }

  /**
   * 初始化网络监控
   */
  init() {
    if (this.initialized) return;
    
    console.log('初始化网络状态监控器...');
    
    // 确保在所有环境下isConnected都有初始值
    this.isConnected = typeof navigator !== 'undefined' && 
                      typeof navigator.onLine !== 'undefined' ? 
                      navigator.onLine : true;
                      
    // 注册浏览器网络事件
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
    
    // 如果在Capacitor环境中，使用Capacitor的Network API
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
      try {
        this.setupCapacitorNetworkListeners();
      } catch (error) {
        console.error('设置Capacitor网络监听器失败，回退到标准浏览器检测:', error);
        // 在Capacitor环境下，如果Network模块加载失败，添加直接检测
        this.setupFallbackCheck();
      }
    } else {
      // 在非Capacitor环境下，添加备用检测方法
      this.setupFallbackCheck();
    }
    
    this.initialized = true;
    console.log(`当前网络状态: ${this.isConnected ? '已连接' : '未连接'}`);
  }
  
  /**
   * 设置Capacitor网络监听
   */
  async setupCapacitorNetworkListeners() {
    try {
      // 获取当前网络状态
      const status = await Network.getStatus();
      this.updateNetworkStatus(status.connected);
      
      // 添加状态变化监听器
      Network.addListener('networkStatusChange', (status) => {
        console.log('Capacitor网络状态变化:', status);
        this.updateNetworkStatus(status.connected);
      });
      
      console.log('Capacitor网络监听器设置成功');
    } catch (error) {
      console.error('设置Capacitor网络监听器失败:', error);
    }
  }
  
  /**
   * 设置备用网络检测
   */
  setupFallbackCheck() {
    console.log('启用备用网络状态检测...');
    
    // 定期检测网络状态
    setInterval(() => {
      if (typeof navigator !== 'undefined' && typeof navigator.onLine !== 'undefined') {
        const isOnline = navigator.onLine;
        if (this.isConnected !== isOnline) {
          if (isOnline) {
            this.handleOnline();
          } else {
            this.handleOffline();
          }
        }
      }
    }, 5000); // 每5秒检测一次
    
    // 尝试使用更主动的检测方法
    this.activeNetworkCheck();
  }
  
  /**
   * 主动网络检测（发送简单请求来验证网络）
   */
  activeNetworkCheck() {
    const checkNetwork = () => {
      if (typeof fetch === 'undefined') return;
      
      // 使用一个稳定的公共API进行检测
      const testUrl = 'https://www.baidu.com/favicon.ico';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      fetch(testUrl, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      })
      .then(() => {
        clearTimeout(timeoutId);
        if (!this.isConnected) {
          console.log('主动检测发现网络已恢复');
          this.updateNetworkStatus(true);
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        if (this.isConnected && !navigator.onLine) {
          console.error('主动检测发现网络已断开:', error.message);
          this.updateNetworkStatus(false);
        }
      });
    };
    
    // 初次检测和定期检测
    checkNetwork();
    setInterval(checkNetwork, 30000); // 每30秒主动检测一次
  }
  
  /**
   * 处理在线事件
   */
  handleOnline() {
    console.log('设备已连接到网络');
    this.updateNetworkStatus(true);
  }
  
  /**
   * 处理离线事件
   */
  handleOffline() {
    console.log('设备已断开网络连接');
    this.updateNetworkStatus(false);
  }
  
  /**
   * 更新网络状态
   * @param {boolean} isConnected 是否已连接
   */
  updateNetworkStatus(isConnected) {
    // 避免重复的状态更新
    if (this.lastStatus === isConnected) return;
    
    this.lastStatus = isConnected;
    this.isConnected = isConnected;
    
    // 通知视觉反馈
    if (isConnected) {
      ElMessage.success('网络已连接');
    } else {
      ElMessage.error('网络连接已断开，请检查网络设置');
    }
    
    // 通知所有监听器
    this.notifyListeners(isConnected);
  }
  
  /**
   * 通知所有监听器
   * @param {boolean} isConnected 是否已连接
   */
  notifyListeners(isConnected) {
    this.listeners.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('执行网络状态监听器回调时出错:', error);
      }
    });
  }
  
  /**
   * 添加网络状态变化监听器
   * @param {Function} callback 回调函数
   * @returns {Function} 移除监听器的函数
   */
  addListener(callback) {
    if (typeof callback !== 'function') {
      console.error('网络监听器回调必须是函数');
      return;
    }
    
    this.listeners.push(callback);
    
    // 立即通知当前状态
    callback(this.isConnected);
    
    // 返回移除监听器的函数
    return () => this.removeListener(callback);
  }
  
  /**
   * 移除网络状态变化监听器
   * @param {Function} callback 回调函数
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }
  
  /**
   * 获取当前网络状态
   * @returns {boolean} 是否已连接
   */
  getNetworkStatus() {
    return this.isConnected;
  }
  
  /**
   * 手动检查网络状态
   * @returns {boolean} 是否已连接
   */
  checkNetworkStatus() {
    const isOnline = navigator.onLine;
    
    if (this.isConnected !== isOnline) {
      this.updateNetworkStatus(isOnline);
    }
    
    return this.isConnected;
  }
}

// 创建单例实例
const networkMonitor = new NetworkMonitor();

export default networkMonitor; 