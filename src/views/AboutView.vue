<template>
  <div class="about-page">
    <!-- 顶部标题 -->
    <div class="about-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>关于我们</h2>
    </div>

    <!-- 内容区域 -->
    <div class="about-container">
      <!-- 应用信息 -->
      <div class="card logo-section">
        <div class="app-logo">
          <img src="../assets/logo.png" alt="时光" />
        </div>
        <h1 class="app-title">时光</h1>
        <div class="app-version">版本 2.1.0</div>
        <div class="app-slogan">记录每一刻美好时光</div>
        <div class="brand-tag">云步出品</div>
      </div>

      <!-- 应用介绍 -->
      <div class="card about-section">
        <div class="section-title">应用介绍</div>
        <div class="section-content">
          <p>
            "时光"是云步品牌旗下的一款生活休闲社区应用，专注于为用户提供分享生活、发现美好的社交平台。
          </p>
          <p>
            我们致力于打造一个轻松友好的社区环境，让每位用户都能自由地记录日常点滴、分享生活见闻，并与志同道合的朋友建立联系。
          </p>
        </div>
      </div>

      <!-- 核心功能 -->
      <div class="card about-section">
        <div class="section-title">核心功能</div>
        <div class="section-content feature-list">
          <div class="feature-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>社区互动</span>
          </div>
          <div class="feature-item">
            <el-icon><Picture /></el-icon>
            <span>图文发布</span>
          </div>
          <div class="feature-item">
            <el-icon><Star /></el-icon>
            <span>点赞评论</span>
          </div>
          <div class="feature-item">
            <el-icon><Collection /></el-icon>
            <span>标签分类</span>
          </div>
          <div class="feature-item">
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </div>
          <div class="feature-item">
            <el-icon><Bell /></el-icon>
            <span>消息通知</span>
          </div>
        </div>
      </div>

      <!-- 品牌简介 -->
      <div class="card about-section">
        <div class="section-title">品牌简介</div>
        <div class="section-content">
          <p>
            "云步"是一家致力于创造美好数字生活体验的科技品牌。我们相信科技应当服务于人类的日常需求，使生活更加便捷、丰富和有意义。
          </p>
          <p>
            作为"云步"的核心产品之一，"时光"社区承载着我们连接人与人之间情感的使命，为用户提供一个展示自我、分享感悟的线上家园。
          </p>
        </div>
      </div>

      <!-- 愿景使命 -->
      <div class="card about-section">
        <div class="section-title">愿景与使命</div>
        <div class="section-content">
          <p class="vision">
            <strong>愿景：</strong>成为最受欢迎的生活分享社区，让每个人的故事被看见
          </p>
          <p class="mission">
            <strong>使命：</strong>连接热爱生活的人们，共同构建一个积极、温暖的内容社区
          </p>
        </div>
      </div>

      <!-- 许可与声明 -->
      <div class="card about-section">
        <div class="section-title">许可与声明</div>
        <div class="section-content">
          <p>
            本应用基于Apache License
            2.0许可证开源，您可以在遵循许可证条款的前提下自由使用、修改和分发本应用。
          </p>
          <div class="license-badges">
            <div class="badge">
              <a
                href="https://opensource.org/licenses/Apache-2.0"
                target="_blank"
              >
                <img
                  src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"
                  alt="License"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 版权信息 -->
      <div class="copyright-section">
        <p>Copyright © 2024 云步科技. All Rights Reserved.</p>
        <p>欢迎关注我们的更多产品</p>
        <a
          href="https://github.com/alin776/shiguang"
          target="_blank"
          class="github-link"
        >
          <el-icon><Link /></el-icon> GitHub
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  Picture,
  ChatDotRound,
  User,
  Bell,
  Link,
  Star,
  Collection,
} from "@element-plus/icons-vue";

const router = useRouter();
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background-color: #f9f7f4;
  color: #333;
  position: relative;
  overflow-x: hidden;
  padding-bottom: 40px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.about-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ffffff;
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  width: 100%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.back-icon {
  font-size: 20px;
  color: #f5a623;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
  transition: all 0.3s ease;
}

.back-icon:hover {
  transform: translateX(-3px);
  color: #e09819;
}

.about-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  flex: 1;
  color: #333;
}

.about-container {
  padding: 30px 20px;
  max-width: 800px;
  margin: 0 auto;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  text-align: center;
  background: linear-gradient(to bottom, #ffffff, #faf8f5);
}

.app-logo {
  width: 100px;
  height: 100px;
  border-radius: 22px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255, 255, 255);
  box-shadow: 0 4px 15px rgba(245, 166, 35, 0.1);
  margin-bottom: 16px;
}

.app-logo img {
  width: 70%;
  height: 70%;
  object-fit: contain;
}

.app-title {
  font-size: 28px;
  font-weight: 600;
  margin: 8px 0;
  color: #333;
}

.app-version {
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}

.app-slogan {
  font-size: 16px;
  color: #f5a623;
  margin-bottom: 8px;
}

.brand-tag {
  display: inline-block;
  padding: 4px 16px;
  background: #f5a623;
  color: white;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 12px;
  letter-spacing: 0.5px;
}

.about-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: #faf8f5;
}

.section-content {
  padding: 20px;
  line-height: 1.6;
  color: #555;
}

.section-content p {
  margin: 0 0 16px;
}

.section-content p:last-child {
  margin-bottom: 0;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  border-radius: 12px;
  background: linear-gradient(to bottom, #ffffff, #faf8f5);
  transition: all 0.3s;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.feature-item:hover {
  box-shadow: 0 4px 15px rgba(245, 166, 35, 0.1);
  transform: translateY(-2px);
}

.feature-item .el-icon {
  font-size: 28px;
  color: #f5a623;
}

.vision,
.mission {
  padding: 16px;
  border-radius: 8px;
  background: #faf8f5;
  margin-bottom: 16px;
  border-left: 3px solid #f5a623;
}

.license-badges {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.badge {
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s;
}

.badge:hover {
  transform: scale(1.05);
}

.copyright-section {
  text-align: center;
  padding: 24px 0;
  color: #888;
  font-size: 14px;
}

.copyright-section p {
  margin: 4px 0;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  color: #f5a623;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 30px;
  background: #faf8f5;
  transition: all 0.3s;
  font-weight: 500;
}

.github-link:hover {
  background: #f5a623;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(245, 166, 35, 0.2);
}

/* 移动端优化 */
@media screen and (max-width: 768px) {
  .feature-list {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-title {
    font-size: 15px;
  }

  .section-content {
    font-size: 14px;
  }
}

@media screen and (max-width: 480px) {
  .about-container {
    padding: 20px 12px;
  }

  .app-logo {
    width: 80px;
    height: 80px;
  }

  .app-title {
    font-size: 24px;
  }
}
</style>
