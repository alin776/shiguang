import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from './auth';

export const useTaskStore = defineStore('task', () => {
  const authStore = useAuthStore();
  
  // 任务数据
  const dailyTasks = ref([]);
  const dailyExpGained = ref(0);
  const dailyExpLimit = ref(50); // 每日经验值上限
  const lastUpdated = ref(null);
  
  // 获取任务完成状态
  const fetchDailyTasks = async () => {
    try {
      // 检查用户是否已登录
      if (!authStore.isAuthenticated) {
        throw new Error('用户未登录');
      }
      
      // 调用后端API获取任务状态
      const response = await axios.get(`${API_BASE_URL}/api/tasks/daily`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      
      // 更新任务数据
      if (response.data && response.data.tasks) {
        dailyTasks.value = response.data.tasks;
        dailyExpGained.value = response.data.expGained || 0;
        dailyExpLimit.value = response.data.expLimit || 50;
        lastUpdated.value = new Date();
      } else {
        // 如果后端暂未实现，使用本地模拟数据
        initMockTasks();
      }
      
      return dailyTasks.value;
    } catch (error) {
      console.error('获取任务状态失败:', error);
      
      // 使用本地模拟数据
      initMockTasks();
      
      // 向上传递错误
      throw error;
    }
  };
  
  // 更新任务进度
  const updateTaskProgress = async (taskType, increment = 1) => {
    try {
      // 检查用户是否已登录
      if (!authStore.isAuthenticated) {
        return;
      }
      
      // 找到对应任务
      const task = dailyTasks.value.find(t => t.type === taskType);
      if (!task) return;
      
      // 检查任务是否已完成
      if (task.isCompleted) return;
      
      // 计算新进度
      const newProgress = Math.min(task.current + increment, task.target);
      const wasCompleted = task.current < task.target && newProgress >= task.target;
      
      // 更新任务进度
      task.current = newProgress;
      task.isCompleted = newProgress >= task.target;
      
      // 如果任务刚刚完成，增加经验值
      if (wasCompleted) {
        // 获取上限前的经验值
        const expBeforeCap = dailyExpGained.value;
        // 计算可获得的经验值（考虑每日上限）
        const earnableExp = Math.min(task.reward, dailyExpLimit.value - expBeforeCap);
        // 更新已获得经验值
        dailyExpGained.value = Math.min(expBeforeCap + earnableExp, dailyExpLimit.value);
        
        // 调用后端API更新任务状态
        await axios.post(`${API_BASE_URL}/api/tasks/complete`, {
          taskType,
          newProgress,
          earnedExp: earnableExp
        }, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        
        // 同步更新用户经验值
        if (earnableExp > 0) {
          authStore.addExperience(earnableExp);
        }
      } else {
        // 仅更新进度
        await axios.post(`${API_BASE_URL}/api/tasks/progress`, {
          taskType,
          newProgress
        }, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
      }
    } catch (error) {
      console.error('更新任务进度失败:', error);
      // 错误处理
    }
  };
  
  // 初始化模拟任务数据（后端API未实现时使用）
  const initMockTasks = () => {
    // 获取当前时间作为缓存时间戳
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // 从本地存储获取缓存的任务数据
    const cachedTasksStr = localStorage.getItem('dailyTasks');
    const cachedTimeStr = localStorage.getItem('dailyTasksTime');
    const cachedExpGained = localStorage.getItem('dailyExpGained');
    
    // 检查缓存是否是今天的
    if (cachedTasksStr && cachedTimeStr && Number(cachedTimeStr) >= today) {
      try {
        dailyTasks.value = JSON.parse(cachedTasksStr);
        dailyExpGained.value = Number(cachedExpGained || '0');
        return;
      } catch (e) {
        console.error('解析缓存任务数据失败:', e);
        // 继续初始化新任务
      }
    }
    
    // 初始化新任务
    dailyTasks.value = [
      {
        id: 1,
        type: 'post',
        title: '发布帖子',
        description: '在社区发布1篇帖子',
        current: 0,
        target: 1,
        reward: 10,
        isCompleted: false
      },
      {
        id: 2,
        type: 'comment',
        title: '评论互动',
        description: '在社区评论3次',
        current: 0,
        target: 3,
        reward: 5,
        isCompleted: false
      },
      {
        id: 3,
        type: 'like',
        title: '点赞支持',
        description: '给喜欢的帖子点赞5次',
        current: 0,
        target: 5,
        reward: 2,
        isCompleted: false
      }
    ];
    
    dailyExpGained.value = 0;
    
    // 缓存任务数据
    localStorage.setItem('dailyTasks', JSON.stringify(dailyTasks.value));
    localStorage.setItem('dailyTasksTime', today.toString());
    localStorage.setItem('dailyExpGained', '0');
  };
  
  // 重置每日任务（通常在新的一天调用）
  const resetDailyTasks = () => {
    // 重置任务进度
    dailyTasks.value.forEach(task => {
      task.current = 0;
      task.isCompleted = false;
    });
    
    // 重置每日获取的经验值
    dailyExpGained.value = 0;
    
    // 更新本地缓存
    const today = new Date();
    const todayTimestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    localStorage.setItem('dailyTasks', JSON.stringify(dailyTasks.value));
    localStorage.setItem('dailyTasksTime', todayTimestamp.toString());
    localStorage.setItem('dailyExpGained', '0');
  };
  
  // 检查并处理跨天重置
  const checkDailyReset = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const cachedTimeStr = localStorage.getItem('dailyTasksTime');
    if (!cachedTimeStr || Number(cachedTimeStr) < today) {
      resetDailyTasks();
      return true;
    }
    
    return false;
  };
  
  // 暴露的方法和状态
  return {
    dailyTasks,
    dailyExpGained,
    dailyExpLimit,
    lastUpdated,
    fetchDailyTasks,
    updateTaskProgress,
    resetDailyTasks,
    checkDailyReset
  };
}); 