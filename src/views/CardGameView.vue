<template>
  <div class="card-game-container">
    <div class="back-button-container">
      <button class="back-button" @click="$router.back()">
        <span class="back-icon">←</span> 返回
      </button>
    </div>
    
    <h1 class="game-title">猜猜哪张卡</h1>
    
    <!-- 游戏规则 -->
    <div class="rules-panel">
      <h2>游戏规则</h2>
      <ul>
        <li>每天只能参与一次，投注后等待晚上11点开奖</li>
        <li>投注金额由您自行决定（10-1000积分）</li>
        <li>从三张卡片中选择一张，猜中有2.5倍奖励</li>
        <li>猜错则损失投注积分</li>
        <li>开奖结果将于每晚11:00公布</li>
        <li>下一轮游戏将于次日00:00开始</li>
      </ul>
    </div>

    <!-- 倒计时区域 -->
    <div class="countdown-section">
      <template v-if="isDrawTime">
        <div class="countdown-timer">
          <h3>距离开奖还有</h3>
          <div class="timer">{{ drawCountdown }}</div>
        </div>
      </template>
      <template v-else-if="isResultTime">
        <div class="countdown-timer">
          <h3>距离下一轮开始还有</h3>
          <div class="timer">{{ nextRoundCountdown }}</div>
        </div>
      </template>
    </div>

    <!-- 游戏区域 -->
    <div class="game-area" :class="{ 'disabled': !canPlay }">
      <!-- 投注表单 -->
      <div v-if="gameStatus === 'ready' && !todayBet" class="bet-form">
        <h3>今日投注</h3>
        <div class="input-group">
          <label for="betAmount">投注金额 (10-1000积分)</label>
          <input 
            id="betAmount" 
            v-model="betAmount" 
            type="number" 
            min="10" 
            max="1000" 
            :disabled="!canPlay"
          />
        </div>
        <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
      </div>

      <!-- 已投注状态 -->
      <div v-if="todayBet && !todayResult" class="bet-info">
        <h3>您今日已投注</h3>
        <p>投注金额: {{ todayBet.bet_amount }} 积分</p>
        <p>选择卡片: 第 {{ todayBet.selected_position + 1 }} 张</p>
        <p>等待开奖中...</p>
      </div>

      <!-- 开奖结果 -->
      <div v-if="todayResult" class="result-info">
        <h3>开奖结果</h3>
        <p>
          中奖卡片: 第 {{ todayResult.winningPosition + 1 }} 张
          <span v-if="todayResult.userBet" class="result-badge" :class="todayResult.userBet.isWin ? 'win' : 'loss'">
            {{ todayResult.userBet.isWin ? '恭喜中奖' : '未中奖' }}
          </span>
        </p>
        <div v-if="todayResult.userBet" class="user-result">
          <p>您的选择: 第 {{ todayResult.userBet.selectedPosition + 1 }} 张</p>
          <p>投注金额: {{ todayResult.userBet.betAmount }} 积分</p>
          <p v-if="todayResult.userBet.isWin">
            获得奖励: {{ Math.floor(todayResult.userBet.betAmount * 2.5) }} 积分
            <span class="profit">(净赚 {{ Math.floor(todayResult.userBet.betAmount * 1.5) }} 积分)</span>
          </p>
        </div>
      </div>

      <!-- 卡片区域 -->
      <div class="cards-container">
        <div 
          v-for="index in 3" 
          :key="index-1"
          class="card" 
          :class="{ 
            'selected': selectedCard === index-1,
            'winning': todayResult && todayResult.winningPosition === index-1,
            'losing': todayResult && todayResult.winningPosition !== index-1 && todayBet && todayBet.selected_position === index-1
          }"
          @click="selectCard(index-1)"
        >
          <div class="card-inner">
            <div class="card-front">
              <div class="card-number">{{ index }}</div>
            </div>
            <div class="card-back">
              <div v-if="todayResult && todayResult.winningPosition === index-1" class="win-icon">🏆</div>
              <div v-else class="lose-icon">❌</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button 
          v-if="gameStatus === 'ready' && !todayBet" 
          @click="placeBet" 
          class="bet-button"
          :disabled="!canPlay || !isValidBet || selectedCard === null"
        >
          确认投注
        </button>
      </div>
    </div>

    <!-- 游戏统计 -->
    <div class="stats-panel">
      <h2>游戏统计</h2>
      <div class="stats-content" v-if="playerStats">
        <div class="stat-item">
          <div class="stat-value">{{ playerStats.total_games }}</div>
          <div class="stat-label">总参与次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ playerStats.wins }}</div>
          <div class="stat-label">获胜次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" :class="{ positive: playerStats.total_profit > 0, negative: playerStats.total_profit < 0 }">
            {{ playerStats.total_profit }}
          </div>
          <div class="stat-label">累计盈亏</div>
        </div>
      </div>
    </div>

    <!-- 游戏历史 -->
    <div class="history-panel">
      <h2>游戏历史</h2>
      <div class="history-list" v-if="gameHistory.length > 0">
        <div v-for="(record, index) in gameHistory" :key="index" class="history-item">
          <div class="history-date">{{ formatDate(record.created_at) }}</div>
          <div class="history-details">
            <div class="winning-card">中奖卡片: {{ record.winning_position + 1 }}</div>
            <template v-if="record.participated">
              <div class="selection" :class="{ 'win': record.is_win, 'loss': !record.is_win }">
                您的选择: {{ record.selected_position + 1 }}
                <span class="result-indicator">{{ record.is_win ? '✅' : '❌' }}</span>
              </div>
              <div class="bet-result">
                <span>投注: {{ record.bet_amount }}</span>
                <span v-if="record.is_win">赢得: {{ record.reward }}</span>
              </div>
            </template>
            <div v-else class="no-participate">未参与</div>
          </div>
        </div>
      </div>
      <div v-else class="no-history">暂无游戏历史</div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useCardGameStore } from '@/stores/cardGame';

export default {
  name: 'CardGameView',
  
  setup() {
    const cardGameStore = useCardGameStore();
    
    // 状态变量
    const gameStatus = ref('loading'); // loading, ready, betting, result
    const selectedCard = ref(null);
    const betAmount = ref(100);
    const errorMessage = ref('');
    
    // 倒计时相关
    const drawTime = ref('');
    const nextRoundTime = ref('');
    const drawCountdown = ref('');
    const nextRoundCountdown = ref('');
    let countdownInterval = null;
    
    // 计算属性
    const isValidBet = computed(() => {
      const amount = Number(betAmount.value);
      return amount >= 10 && amount <= 1000;
    });
    
    const todayBet = computed(() => cardGameStore.todayBet);
    const todayResult = computed(() => cardGameStore.todayResult);
    const gameHistory = computed(() => cardGameStore.gameHistory);
    const playerStats = computed(() => cardGameStore.playerStats);
    
    // 判断当前是否是开奖时间段（晚上11点到0点）
    const isDrawTime = computed(() => {
      const now = new Date();
      const hour = now.getHours();
      return hour < 23 && hour >= 0;
    });
    
    // 判断当前是否是结果展示时间（0点到次日）
    const isResultTime = computed(() => {
      return !isDrawTime.value;
    });
    
    // 判断是否可以进行游戏
    const canPlay = computed(() => {
      return gameStatus.value === 'ready' && isDrawTime.value && !todayBet.value;
    });
    
    // 方法
    const selectCard = (index) => {
      if (!canPlay.value) return;
      selectedCard.value = index;
    };
    
    // 投注
    const placeBet = async () => {
      if (!canPlay.value || !isValidBet.value || selectedCard.value === null) return;
      
      console.log("开始投注:", {
        cardIndex: selectedCard.value,
        amount: Number(betAmount.value),
        isValid: isValidBet.value,
        canPlay: canPlay.value
      });
      
      try {
        errorMessage.value = '';
        gameStatus.value = 'betting';
        
        await cardGameStore.placeBet({ 
          cardIndex: selectedCard.value, 
          amount: Number(betAmount.value) 
        });
        
        gameStatus.value = 'ready';
        console.log("投注成功，刷新数据");
        await loadGameData();  // 投注成功后刷新数据
      } catch (error) {
        console.error("投注失败:", error);
        errorMessage.value = error.message || '投注失败，请重试';
        gameStatus.value = 'ready';
      }
    };
    
    // 格式化日期
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 更新倒计时
    const updateCountdown = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // 今天23:00
      const todayDraw = new Date(today);
      todayDraw.setHours(23, 0, 0, 0);
      
      // 明天00:00
      const tomorrowStart = new Date(today);
      tomorrowStart.setDate(today.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);
      
      // 计算距离开奖的时间
      if (now < todayDraw) {
        const diff = todayDraw - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        drawCountdown.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      } else {
        drawCountdown.value = '00:00:00';
      }
      
      // 计算距离下一轮的时间
      if (now >= todayDraw && now < tomorrowStart) {
        const diff = tomorrowStart - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        nextRoundCountdown.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      } else {
        nextRoundCountdown.value = '';
      }
    };
    
    // 加载游戏数据
    const loadGameData = async () => {
      try {
        gameStatus.value = 'loading';
        
        // 获取今日投注
        await cardGameStore.getTodayBet().catch(() => {
          // 错误404表示今天没有投注，这是正常的情况
        });
        
        // 获取开奖结果
        await cardGameStore.getDrawResult().catch(() => {
          // 错误404表示今天还没有开奖，这是正常的情况
        });
        
        // 获取游戏历史
        await cardGameStore.getGameHistory();
        
        // 获取玩家统计
        await cardGameStore.getPlayerStats();
        
        gameStatus.value = 'ready';
      } catch (error) {
        console.error('加载游戏数据失败', error);
        gameStatus.value = 'ready';
      }
    };
    
    // 组件挂载
    onMounted(() => {
      loadGameData();
      
      // 设置倒计时定时器
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    });
    
    // 组件卸载
    onUnmounted(() => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    });
    
    return {
      gameStatus,
      selectedCard,
      betAmount,
      errorMessage,
      todayBet,
      todayResult,
      gameHistory,
      playerStats,
      drawCountdown,
      nextRoundCountdown,
      isDrawTime,
      isResultTime,
      canPlay,
      isValidBet,
      selectCard,
      placeBet,
      formatDate
    };
  }
};
</script>

<style scoped>
.card-game-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background: linear-gradient(to bottom, #f9f9f9, #e9e9e9);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.back-button-container {
  text-align: left;
  margin-bottom: 20px;
}

.back-button {
  background: linear-gradient(to right, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
  display: inline-flex;
  align-items: center;
}

.back-button:hover {
  background: linear-gradient(to right, #2980b9, #1f618d);
  box-shadow: 0 6px 12px rgba(52, 152, 219, 0.4);
  transform: translateY(-2px);
}

.back-icon {
  margin-right: 8px;
  font-size: 1.2rem;
  font-weight: bold;
}

.game-title {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
  font-size: 2.2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.game-title:after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(to right, #3498db, #2ecc71);
  border-radius: 3px;
}

.rules-panel, .stats-panel, .history-panel {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.rules-panel:hover, .stats-panel:hover, .history-panel:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.rules-panel h2, .stats-panel h2, .history-panel h2 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.4rem;
  position: relative;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.rules-panel h2:after, .stats-panel h2:after, .history-panel h2:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(to right, #3498db, #9b59b6);
  border-radius: 3px;
}

.rules-panel ul {
  padding-left: 20px;
}

.rules-panel li {
  margin-bottom: 8px;
}

.countdown-section {
  text-align: center;
  margin-bottom: 30px;
}

.countdown-timer {
  display: inline-block;
  background: linear-gradient(to right, #2c3e50, #4a6491);
  color: white;
  padding: 15px 25px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  }
  100% {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
}

.countdown-timer h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.timer {
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.game-area {
  background-color: #ffffff;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.game-area.disabled {
  opacity: 0.7;
  pointer-events: none;
}

.bet-form h3, .bet-info h3, .result-info h3 {
  color: #2c3e50;
  font-size: 1.3rem;
  margin-top: 0;
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #34495e;
}

.input-group input {
  width: 100%;
  max-width: 200px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.1rem;
  text-align: center;
  margin: 0 auto;
  transition: all 0.3s;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.input-group input:focus {
  border-color: #3498db;
  box-shadow: inset 0 1px 3px rgba(52, 152, 219, 0.2);
  outline: none;
}

.error-message {
  color: #e74c3c;
  margin-top: 10px;
}

.bet-info, .result-info {
  margin-bottom: 25px;
  padding: 20px;
  border-radius: 12px;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bet-info {
  background: linear-gradient(to right, #f1f8e9, #dcedc8);
  border-left: 5px solid #8bc34a;
}

.result-info {
  background: linear-gradient(to right, #e8f5e9, #c8e6c9);
  border-left: 5px solid #4caf50;
}

.result-badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 50px;
  margin-left: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  animation: badgeFadeIn 0.5s ease-out 0.2s both;
}

@keyframes badgeFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.result-badge.win {
  background-color: #c8e6c9;
  color: #2e7d32;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.2);
}

.result-badge.loss {
  background-color: #ffcdd2;
  color: #c62828;
  box-shadow: 0 2px 8px rgba(198, 40, 40, 0.2);
}

.user-result {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ddd;
}

.profit {
  color: #2e7d32;
  font-weight: bold;
}

.cards-container {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 40px 0;
}

.card {
  width: 140px;
  height: 200px;
  perspective: 1500px;
  cursor: pointer;
  position: relative;
  transition: transform 0.3s;
  border-radius: 15px;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-10px) scale(1.03);
}

.card-inner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-style: preserve-3d;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-radius: 15px;
}

.card.selected .card-inner {
  box-shadow: 0 0 0 4px #4caf50, 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: selectedPulse 1.5s infinite;
}

@keyframes selectedPulse {
  0% {
    box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.6), 0 10px 25px rgba(0, 0, 0, 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(76, 175, 80, 1), 0 10px 25px rgba(0, 0, 0, 0.4);
  }
  100% {
    box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.6), 0 10px 25px rgba(0, 0, 0, 0.2);
  }
}

.card.winning .card-inner {
  transform: rotateY(180deg);
  box-shadow: 0 0 30px rgba(76, 175, 80, 0.6), 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: winningGlow 2s infinite;
}

@keyframes winningGlow {
  0% {
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.6), 0 10px 25px rgba(0, 0, 0, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(76, 175, 80, 0.8), 0 10px 25px rgba(0, 0, 0, 0.3);
  }
  100% {
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.6), 0 10px 25px rgba(0, 0, 0, 0.2);
  }
}

.card.losing .card-inner {
  transform: rotateY(180deg);
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.4), 0 10px 25px rgba(0, 0, 0, 0.2);
}

.card-front, .card-back {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
}

.card-front {
  background: linear-gradient(135deg, #3498db, #8e44ad);
  color: white;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
}

.card-front:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
  opacity: 0.3;
}

.card-back {
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  transform: rotateY(180deg);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.card-number {
  font-size: 4rem;
  font-weight: 800;
  text-shadow: 3px 3px 5px rgba(0, 0, 0, 0.2);
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.win-icon, .lose-icon {
  font-size: 4rem;
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  70% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}

.win-icon {
  color: #4caf50;
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.lose-icon {
  color: #f44336;
  text-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
}

.action-buttons {
  margin-top: 30px;
}

.bet-button {
  background: linear-gradient(to right, #4caf50, #45a049);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.bet-button:hover {
  background: linear-gradient(to right, #45a049, #2e7d32);
  box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
  transform: translateY(-2px);
}

.bet-button:disabled {
  background: linear-gradient(to right, #cccccc, #bbbbbb);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  cursor: not-allowed;
  transform: none;
}

.stats-content {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  background-color: #f9f9f9;
  padding: 15px 20px;
  border-radius: 10px;
  transition: transform 0.3s;
  width: 30%;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.stat-item:hover {
  transform: translateY(-5px);
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 8px;
  position: relative;
  display: inline-block;
}

.stat-value::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background-color: currentColor;
  border-radius: 2px;
  opacity: 0.6;
}

.stat-value.positive {
  color: #4caf50;
}

.stat-value.negative {
  color: #f44336;
}

.stat-label {
  color: #666;
  font-weight: 500;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid #eeeeee;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 5px;
}

.history-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  transition: background-color 0.2s;
}

.history-item:hover {
  background-color: #f5f5f5;
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  width: 180px;
  color: #666;
}

.history-details {
  flex-grow: 1;
}

.selection {
  margin-top: 5px;
}

.selection.win {
  color: #4caf50;
}

.selection.loss {
  color: #f44336;
}

.bet-result {
  margin-top: 5px;
  color: #666;
  display: flex;
  gap: 15px;
}

.no-participate {
  color: #999;
  font-style: italic;
}

.no-history {
  color: #999;
  text-align: center;
  padding: 20px;
}

@media (max-width: 600px) {
  .card {
    width: 100px;
    height: 150px;
    border-radius: 10px;
  }
  
  .card-number {
    font-size: 3rem;
  }
  
  .card-number::after {
    width: 60px;
    height: 60px;
  }
  
  .cards-container {
    gap: 15px;
  }
  
  .history-item {
    flex-direction: column;
  }
  
  .history-date {
    width: 100%;
    margin-bottom: 8px;
  }
  
  .countdown-timer {
    padding: 10px 15px;
  }
  
  .timer {
    font-size: 1.8rem;
  }
  
  .game-title {
    font-size: 1.8rem;
  }
  
  .stat-item {
    padding: 10px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}
</style> 