<template>
  <div class="title-guide-container">
    <div class="title-guide-header">
      <div class="back-button" @click="router.go(-1)">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h1>称号指南</h1>
    </div>

    <div class="title-description">
      <p>称号是展示您在云步社区中特殊身份和成就的标志。不同的称号代表不同的荣誉和贡献度。</p>
    </div>

    <div class="title-cards">
      <!-- 云步官方称号 -->
      <div class="title-card">
        <div class="title-card-header">
          <span class="title-tag title-official">云步官方</span>
        </div>
        <div class="title-card-content">
          <h3>获取方式</h3>
          <p>云步官方团队成员专属称号，由系统管理员授予。</p>
          <h3>权益</h3>
          <ul>
            <li>社区内容审核权限</li>
            <li>发布官方公告</li>
            <li>专属金色标识</li>
          </ul>
        </div>
      </div>

      <!-- 巅峰大神称号 -->
      <div class="title-card">
        <div class="title-card-header">
          <span class="title-tag title-master">巅峰大神</span>
        </div>
        <div class="title-card-content">
          <h3>获取方式</h3>
          <p>每日系统自动评选，授予社区内发帖数量最多的用户。</p>
          <h3>权益</h3>
          <ul>
            <li>内容曝光率提升</li>
            <li>专属红色标识</li>
            <li>社区内容优先展示</li>
          </ul>
        </div>
      </div>

      <!-- 持之以恒称号 -->
      <div class="title-card">
        <div class="title-card-header">
          <span class="title-tag title-persistent">持之以恒</span>
        </div>
        <div class="title-card-content">
          <h3>获取方式</h3>
          <p>连续5天发布优质内容的用户可获得此称号。</p>
          <h3>权益</h3>
          <ul>
            <li>每日额外经验值奖励</li>
            <li>专属绿色标识</li>
            <li>提高等级提升速度</li>
          </ul>
        </div>
      </div>

      <!-- 未来可能增加的其他称号 -->
      <div class="title-card future-title">
        <div class="title-card-header">
          <span class="title-tag title-future">更多称号</span>
        </div>
        <div class="title-card-content">
          <h3>敬请期待</h3>
          <p>我们将不断增加新的称号和荣誉，展示用户的不同成就和特长。</p>
          <p>期待你的持续参与和贡献！</p>
        </div>
      </div>
    </div>

    <div class="title-faq">
      <h2>常见问题</h2>
      <div class="faq-item">
        <h3>Q: 我的称号什么时候会更新？</h3>
        <p>A: 系统每天凌晨0点自动更新所有用户称号。"巅峰大神"称号每天重新评选，"持之以恒"称号需保持连续发帖才能保留。</p>
      </div>
      <div class="faq-item">
        <h3>Q: 我可以自定义我的称号吗？</h3>
        <p>A: 目前称号由系统根据用户行为自动授予，暂不支持自定义。未来可能会推出更多获取称号的方式。</p>
      </div>
      <div class="faq-item">
        <h3>Q: 如何保持"持之以恒"称号？</h3>
        <p>A: 需要保持每天发布内容的习惯。如果中断发帖，称号将会被取消，需要重新连续发帖5天才能获得。</p>
      </div>
    </div>
  </div>
  <BottomNavBar />
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import BottomNavBar from '../components/BottomNavBar.vue';

const router = useRouter();
</script>

<style scoped>
.title-guide-container {
  padding: 16px;
  margin-bottom: 60px;
}

.title-guide-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f2f2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  cursor: pointer;
}

.title-guide-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.title-description {
  margin-bottom: 24px;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.title-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 30px;
}

.title-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.title-card-header {
  padding: 16px;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
}

.title-tag {
  font-size: 1rem;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: 0.5px;
}

.title-official {
  color: #6d4b2f;
  background-color: #f8d66d;
  border: 1px solid #e3b748;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
}

.title-master {
  color: #ffffff;
  background-color: #e74c3c;
  border: 1px solid #c0392b;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.title-persistent {
  color: #2c5e2e;
  background-color: #a8e2aa;
  border: 1px solid #56c158;
}

.title-future {
  color: #555;
  background-color: #e0e0e0;
  border: 1px solid #ccc;
}

.title-card-content {
  padding: 16px;
}

.title-card-content h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1.1rem;
  color: #333;
}

.title-card-content p {
  margin-bottom: 16px;
}

.title-card-content ul {
  padding-left: 20px;
  margin-bottom: 10px;
}

.title-card-content li {
  margin-bottom: 4px;
}

.title-faq {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.title-faq h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.3rem;
  color: #333;
}

.faq-item {
  margin-bottom: 16px;
}

.faq-item h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1.1rem;
  color: #333;
}

.faq-item p {
  margin: 0;
  color: #555;
}

.future-title {
  opacity: 0.8;
}

@media (prefers-color-scheme: dark) {
  .title-guide-container {
    background-color: #121212;
    color: #e0e0e0;
  }

  .title-guide-header h1 {
    color: #e0e0e0;
  }

  .back-button {
    background-color: #333;
    color: #e0e0e0;
  }

  .title-description {
    background-color: #1e1e1e;
  }

  .title-card {
    background-color: #1e1e1e;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }

  .title-card-header {
    background-color: #2a2a2a;
  }

  .title-official {
    color: #f8d66d;
    background-color: #4a3206;
    border: 1px solid #816d37;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .title-persistent {
    color: #a8e2aa;
    background-color: #1e3e1f;
    border: 1px solid #2c5e2e;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .title-master {
    color: #ffffff;
    background-color: #7d2620;
    border: 1px solid #b74138;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }

  .title-future {
    color: #ccc;
    background-color: #333;
    border: 1px solid #444;
  }

  .title-faq {
    background-color: #1e1e1e;
  }

  .title-faq h2,
  .title-card-content h3,
  .faq-item h3 {
    color: #e0e0e0;
  }

  .faq-item p,
  .title-card-content p {
    color: #bbb;
  }
}
</style> 