<template>
  <div class="ad-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5"></path>
          <path d="M12 19l-7-7 7-7"></path>
        </svg>
      </div>
      <div class="title">广告页面</div>
    </div>
    
    <div class="content">
      <div class="ad-info">
        <p>通过观看广告可以获得时光币奖励</p>
        <p class="reward-rules">
          前10次每次25积分，11-15次每次15积分，16-20次每次10积分
        </p>
      </div>
      
      <button 
        class="watch-ad-button" 
        @click="watchRewardAd"
        :disabled="isRewardButtonDisabled"
        :class="{ disabled: isRewardButtonDisabled }"
      >
        <span v-if="!isRewardButtonDisabled">观看激励视频</span>
        <span v-else-if="isReachedDailyLimit">今日次数已用完</span>
        <span v-else>冷却中 ({{ cooldownTimeLeft }})</span>
      </button>
      
      <div class="watch-limit-info">
        <span>今日已观看: {{ watchCount }}/20</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { API_BASE_URL } from '@/config';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const cooldownTimer = ref(null); // 冷却时间的定时器
const cooldownSeconds = ref(0); // 剩余冷却时间（秒）
const watchCount = ref(0); // 今日观看次数
const todayDate = ref(''); // 当前日期，用于重置每日计数
const points = ref(0); // 用户积分
const isAdPlaying = ref(false);  // 是否正在播放广告

// 计算按钮是否禁用
const isRewardButtonDisabled = computed(() => {
  if (isAdPlaying.value) return true;  // 如果广告正在播放，禁用按钮
  if (cooldownSeconds.value > 0 || isReachedDailyLimit.value) return true;
  return false;
});

// 计算是否达到每日观看上限
const isReachedDailyLimit = computed(() => {
  return watchCount.value >= 20; // 修改为20次
});

// 格式化冷却时间显示
const cooldownTimeLeft = computed(() => {
  const minutes = Math.floor(cooldownSeconds.value / 60);
  const seconds = cooldownSeconds.value % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
});

// 返回上一页
const goBack = () => {
  router.back();
};

// 加载观看数据
const loadWatchData = () => {
  const today = new Date().toISOString().split('T')[0]; // 格式: YYYY-MM-DD
  todayDate.value = today;
  
  // 从localStorage加载数据
  const savedData = localStorage.getItem('adWatchData');
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      // 如果是同一天，恢复计数和冷却时间
      if (data.date === today) {
        watchCount.value = data.count || 0;
        
        // 恢复冷却时间
        if (data.cooldownEndTime) {
          const endTime = new Date(data.cooldownEndTime).getTime();
          const now = new Date().getTime();
          const remaining = Math.floor((endTime - now) / 1000);
          
          // 只有当剩余时间大于0时才设置冷却
          if (remaining > 0) {
            cooldownSeconds.value = remaining;
            startCooldownTimer();
          }
        }
      } else {
        // 新的一天，重置计数
        resetWatchCount();
      }
    } catch (e) {
      console.error('解析保存的观看数据出错', e);
      resetWatchCount();
    }
  }
  
  // 加载用户积分
  loadUserPoints();
};

// 加载用户积分
const loadUserPoints = async () => {
  try {
    console.log('开始加载用户积分信息');
    console.log('当前登录状态:', authStore.isLoggedIn ? '已登录' : '未登录');
    console.log('用户信息:', authStore.user ? `ID: ${authStore.user.id}, 用户名: ${authStore.user.username}` : '未获取到用户信息');
    
    // 确保用户已登录
    const token = authStore.token || localStorage.getItem('token');
    if (!token) {
      console.log('缺少认证token，无法获取积分');
      return;
    }
    
    // 如果有token但没有用户信息，尝试恢复登录
    if (token && !authStore.user) {
      console.log('有token但没有用户信息，尝试恢复登录');
      const success = await authStore.restoreLogin(token);
      console.log('恢复登录结果:', success ? '成功' : '失败');
    }

    // 先尝试从服务器获取最新积分
    console.log('开始从服务器获取积分');
    const response = await fetch(`${API_BASE_URL}/api/users/points`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('服务器返回积分数据:', result);
      points.value = result.points || 0;
      localStorage.setItem('userPoints', points.value.toString());
      console.log('从服务器加载积分成功:', points.value);
      return;
    } else {
      console.error('服务器响应错误:', response.status, response.statusText);
      // 尝试解析错误信息
      try {
        const errorData = await response.json();
        console.error('服务器错误详情:', errorData);
      } catch (e) {
        console.error('无法解析错误详情');
      }
    }
  } catch (e) {
    console.error('从服务器加载积分失败:', e);
  }
  
  // 如果服务器请求失败，从本地存储加载
  console.log('尝试从本地存储加载积分');
  const savedPoints = localStorage.getItem('userPoints');
  if (savedPoints) {
    try {
      points.value = parseInt(savedPoints) || 0;
      console.log('从本地存储加载积分成功:', points.value);
    } catch (e) {
      console.error('解析本地积分数据出错', e);
      points.value = 0;
    }
  } else {
    console.log('本地存储中没有积分数据');
  }
  
  // 尝试同步失败的积分请求
  retryFailedPointsRequests();
};

// 添加积分并保存
const addPoints = async (amount) => {
  try {
    const token = authStore.token || localStorage.getItem('token');
    const userId = authStore.user?.id;
    
    // 判断登录状态
    if (!token) {
      console.warn('用户未提供认证token，仅添加本地积分');
      // 本地积分添加
      points.value += amount;
      localStorage.setItem('userPoints', points.value.toString());
      
      // 记录失败的积分请求，等用户登录后再同步
      saveFailedPointsRequest(amount);
      return false;
    }
    
    // 即使没有userId但有token也尝试请求，后端会从token解析userId
    // 调用服务器API增加积分
    const response = await fetch(`${API_BASE_URL}/api/users/points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: amount,
        source: '广告奖励'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`服务器响应错误: ${response.status}`, errorData);
      throw new Error(`服务器响应错误: ${response.status} - ${errorData.message || '未知错误'}`);
    }
    
    const result = await response.json();
    
    // 更新本地积分缓存
    points.value = result.points || (points.value + amount);
    localStorage.setItem('userPoints', points.value.toString());
    
    console.log(`积分增加成功，当前总积分: ${points.value}`);
    
    // 通知原生应用积分变化（如果有这个接口）
    if (window.android && window.android.onPointsChanged) {
      window.android.onPointsChanged(points.value);
    }
    
    return true;
  } catch (error) {
    console.error('调用积分API出错:', error);
    
    // 记录失败的积分请求
    saveFailedPointsRequest(amount);
    
    // 暂时本地增加积分（作为备选方案）
    points.value += amount;
    localStorage.setItem('userPoints', points.value.toString());
    
    return false;
  }
};

// 保存失败的积分请求
const saveFailedPointsRequest = (amount) => {
  try {
    // 获取现有的失败请求
    const failedRequests = JSON.parse(localStorage.getItem('failedPointsRequests') || '[]');
    
    // 添加新的失败请求
    failedRequests.push({
      amount: amount,
      source: '广告奖励',
      timestamp: new Date().toISOString()
    });
    
    // 保存回本地存储
    localStorage.setItem('failedPointsRequests', JSON.stringify(failedRequests));
  } catch (e) {
    console.error('保存失败的积分请求出错:', e);
  }
};

// 重试失败的积分请求
const retryFailedPointsRequests = async () => {
  try {
    const failedRequests = JSON.parse(localStorage.getItem('failedPointsRequests') || '[]');
    if (failedRequests.length === 0) return;
    
    console.log(`开始重试 ${failedRequests.length} 个失败的积分请求`);
    
    // 依次尝试每个失败的请求
    let successCount = 0;
    for (const request of failedRequests) {
      try {
        const success = await addPoints(request.amount);
        if (success) {
          successCount++;
        }
      } catch (e) {
        console.error('重试单个积分请求失败:', e);
      }
    }
    
    if (successCount > 0) {
      // 从failedRequests中移除成功的请求
      const updatedRequests = failedRequests.slice(successCount);
      localStorage.setItem('failedPointsRequests', JSON.stringify(updatedRequests));
      console.log(`成功同步了 ${successCount} 个积分请求`);
    }
  } catch (e) {
    console.error('重试失败的积分请求出错:', e);
  }
};

// 根据观看次数计算奖励积分
const calculateRewardPoints = (count) => {
  if (count <= 10) {
    return 25; // 前10次每次25积分
  } else if (count <= 15) {
    return 15; // 第11-15次每次15积分
  } else {
    return 10; // 第16-20次每次10积分
  }
};

// 观看广告后奖励积分
const rewardUserAfterAd = async () => {
  try {
    // 根据当前观看次数计算奖励积分
    const rewardPoints = calculateRewardPoints(watchCount.value);
    console.log(`准备为用户添加${rewardPoints}积分奖励（第${watchCount.value}次观看）`);
    
    // 显示加载提示
    ElMessage({
      message: '正在发放奖励...',
      type: 'info',
      duration: 2000
    });
    
    // 尝试添加积分
    const success = await addPoints(rewardPoints);
    
    // 根据结果显示不同的消息
    if (success) {
      ElMessage({
        message: `恭喜获得${rewardPoints}时光币奖励!`,
        type: 'success', 
        duration: 3000
      });
      console.log('积分添加成功');
    } else {
      ElMessage({
        message: `获得${rewardPoints}时光币奖励! (稍后同步到服务器)`,
        type: 'warning',
        duration: 3000
      });
      console.log('积分本地添加成功，等待同步到服务器');
    }
  } catch (error) {
    console.error('奖励积分过程出错:', error);
    ElMessage.error('奖励发放过程中出现错误，请稍后再试');
  }
};

// 保存观看数据到localStorage
const saveWatchData = () => {
  const data = {
    date: todayDate.value,
    count: watchCount.value,
    cooldownEndTime: cooldownSeconds.value > 0 ? 
      new Date(Date.now() + cooldownSeconds.value * 1000).toISOString() : null
  };
  
  localStorage.setItem('adWatchData', JSON.stringify(data));
};

// 重置观看次数
const resetWatchCount = () => {
  watchCount.value = 0;
  cooldownSeconds.value = 0;
  if (cooldownTimer.value) {
    clearInterval(cooldownTimer.value);
    cooldownTimer.value = null;
  }
  saveWatchData();
};

// 开始冷却计时器
const startCooldownTimer = () => {
  // 清除现有计时器
  if (cooldownTimer.value) {
    clearInterval(cooldownTimer.value);
  }
  
  // 设置新计时器，每秒减少冷却时间
  cooldownTimer.value = setInterval(() => {
    if (cooldownSeconds.value > 0) {
      cooldownSeconds.value--;
      saveWatchData(); // 保存最新状态
    } else {
      // 冷却结束，清除计时器
      clearInterval(cooldownTimer.value);
      cooldownTimer.value = null;
    }
  }, 1000);
};

// 观看激励视频广告
const watchRewardAd = async () => {
  // 检查是否已经在播放广告，如果是则直接返回
  if (isAdPlaying.value) {
    console.log('广告正在播放中，请勿重复点击');
    return;
  }

  // 检查每日观看次数
  if (isReachedDailyLimit.value) {
    ElMessage.warning('您今日的观看次数已达上限');
    return;
  }

  // 取消CD检查
  // if (cooldownSeconds.value > 0) {
  //   ElMessage.warning(`请等待 ${cooldownTimeLeft.value} 后再观看`);
  //   return;
  // }

  // 设置为正在播放广告状态
  isAdPlaying.value = true;

  // 使用Capacitor插件调用
  try {
    console.log('准备通过插件展示激励视频广告');
    
    // 调用插件方法
    const result = await window.Capacitor.Plugins.RewardAd.showRewardAd({
      placementId: '7996454374369345',
      userId: authStore.user?.id?.toString() || '',
    });
    
    console.log('广告展示成功，获得奖励:', result);
  } catch (error) {
    console.error('加载激励视频广告失败:', error);
    ElMessage.error('广告加载失败，请稍后再试');
    // 重置广告播放状态
    isAdPlaying.value = false;
  }
};

// 在onRewardAdClose和onAdClose回调中添加重置广告播放状态
const onRewardAdClose = (placementId) => {
  console.log('激励视频广告关闭', placementId);
  // 广告播放结束后重置状态
  isAdPlaying.value = false;
};

// 设置安卓回调
const setupAndroidCallbacks = () => {
  try {
    // 激励视频加载成功回调
    window.onRewardAdLoadSuccess = (placementId) => {
      console.log('安卓回调: 激励视频广告加载成功', placementId);
    };
    
    // 激励视频加载失败回调
    window.onRewardAdLoadFailed = (placementId, code, message) => {
      console.error('安卓回调: 激励视频广告加载失败', placementId, code, message);
      // 重置广告播放状态
      isAdPlaying.value = false;
      ElMessage.error('广告加载失败，请稍后再试');
    };
    
    // 激励视频展示成功回调
    window.onRewardAdShowSuccess = (placementId) => {
      console.log('安卓回调: 激励视频广告展示成功', placementId);
    };
    
    // 激励视频展示失败回调 
    window.onRewardAdShowFailed = (placementId, code, message) => {
      console.error('安卓回调: 激励视频广告展示失败', placementId, code, message);
      // 重置广告播放状态
      isAdPlaying.value = false;
      ElMessage.error('广告展示失败，请稍后再试');
    };
    
    // 激励视频被点击回调
    window.onRewardAdClicked = (placementId) => {
      console.log('安卓回调: 激励视频广告被点击', placementId);
    };
    
    // 激励视频关闭回调
    window.onRewardAdClosed = (placementId) => {
      console.log('安卓回调: 激励视频广告关闭', placementId);
      // 重置广告播放状态
      isAdPlaying.value = false;
    };
    
    // 激励视频奖励回调
    window.onRewardAdRewarded = (rewardJson) => {
      try {
        const reward = JSON.parse(rewardJson);
        console.log('安卓回调: 用户获得奖励', reward);
        
        // 增加观看次数，但不设置冷却时间
        // cooldownSeconds.value = 5 * 60; // 5分钟 = 300秒
        cooldownSeconds.value = 0; // 取消CD时间
        watchCount.value++;
        saveWatchData();
        // 不再启动冷却计时器
        // startCooldownTimer();
        
        // 奖励积分
        rewardUserAfterAd();
      } catch (e) {
        console.log('安卓回调: 用户获得奖励，JSON解析失败', rewardJson);
        
        // 增加观看次数，但不设置冷却时间
        // cooldownSeconds.value = 5 * 60; // 5分钟 = 300秒
        cooldownSeconds.value = 0; // 取消CD时间
        watchCount.value++;
        saveWatchData();
        // 不再启动冷却计时器
        // startCooldownTimer();
        
        // 奖励积分
        rewardUserAfterAd();
      }
    };
    
    console.log('安卓广告回调设置完成');
  } catch (e) {
    console.error('设置安卓回调失败:', e);
  }
};

// 激励视频广告奖励回调（用于模拟环境，实际环境不会调用）
const onRewardAdRewarded = (reward) => {
  console.log('用户获得奖励', reward);
  
  // 不再设置冷却时间，只增加观看次数
  // cooldownSeconds.value = 5 * 60; // 5分钟 = 300秒
  cooldownSeconds.value = 0; // 取消CD时间
  watchCount.value++;
  saveWatchData();
  // 不再启动冷却计时器
  // startCooldownTimer();
  
  // 奖励积分
  rewardUserAfterAd();
};

onMounted(() => {
  // 检查登录状态
  if (!authStore.isLoggedIn) {
    console.log('尝试从localStorage恢复登录状态');
    const token = localStorage.getItem('token');
    if (token) {
      // 如果有token但authStore未登录，尝试恢复登录状态
      authStore.restoreLogin(token);
    }
  }
  
  // 加载观看数据
  loadWatchData();
  
  // 设置安卓回调
  setupAndroidCallbacks();
  
  // 添加Capacitor插件事件监听
  window.Capacitor.Plugins.RewardAd.addListener('onRewardAdRewarded', (reward) => {
    console.log('Capacitor插件回调: 获得奖励', reward);
    
    // 增加观看次数
    cooldownSeconds.value = 0; // 取消CD时间
    watchCount.value++;
    saveWatchData();
    
    // 奖励积分
    rewardUserAfterAd();
  });
  
  window.Capacitor.Plugins.RewardAd.addListener('onRewardAdClosed', () => {
    console.log('Capacitor插件回调: 广告关闭');
    isAdPlaying.value = false;
  });
  
  window.Capacitor.Plugins.RewardAd.addListener('onRewardAdLoadFailed', (error) => {
    console.error('Capacitor插件回调: 广告加载失败', error);
    isAdPlaying.value = false;
    ElMessage.error('广告加载失败，请稍后再试');
  });
  
  // 尝试同步失败的积分请求
  retryFailedPointsRequests();
  
  // 通知安卓广告页面已加载
  if (window.android && window.android.onAdPageLoaded) {
    window.android.onAdPageLoaded();
  }
});

onUnmounted(() => {
  // 清除冷却定时器
  if (cooldownTimer.value) {
    clearInterval(cooldownTimer.value);
    cooldownTimer.value = null;
  }
  
  // 移除Capacitor插件事件监听
  window.Capacitor.Plugins.RewardAd.removeAllListeners();
  
  // 页面卸载时保存观看数据
  saveWatchData();
});
</script>

<style scoped>
.ad-container {
  width: 100%;
  height: 100%;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  position: relative;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.back-button {
  position: absolute;
  left: 15px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #333;
}

.title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.ad-info {
  margin: 15px 0;
  text-align: center;
  color: #666;
}

.watch-ad-button {
  padding: 12px 24px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s;
  align-self: center;
  margin: 10px 0;
  min-width: 180px;
}

.watch-ad-button:hover:not(.disabled) {
  background-color: #45a049;
}

.watch-ad-button.disabled {
  background-color: #cccccc;
  color: #666666;
  cursor: not-allowed;
  box-shadow: none;
}

.watch-limit-info {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.reward-rules {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}
</style> 