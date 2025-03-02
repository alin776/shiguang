<template>
  <div class="about-page">
    <!-- 宇宙粒子背景 -->
    <SpaceBackground />

    <!-- 顶部标题 -->
    <div class="about-header">
      <el-icon class="back-icon" @click="router.back()"><ArrowLeft /></el-icon>
      <h2>关于我们</h2>
    </div>

    <!-- 内容区域 -->
    <div class="about-container">
      <!-- 应用信息 -->
      <div class="tech-card enhanced-border logo-section">
        <div class="app-logo">
          <img src="../assets/logo.png" alt="时光" />
        </div>
        <h1 class="app-title">时光</h1>
        <div class="app-version">版本 1.0.0</div>
        <div class="app-slogan">记录每一刻美好时光</div>
      </div>

      <!-- 应用介绍 -->
      <div class="tech-card enhanced-border about-section">
        <div class="section-title">应用介绍</div>
        <div class="section-content">
          <p>
            "时光"是一款集日程管理、社区互动于一体的多功能应用，让您能够轻松规划日常、记录生活点滴并与朋友分享美好时光。
          </p>
          <p>
            我们致力于打造一个简约而不简单的时间管理工具，帮助您合理安排每一天，同时也能够记录并分享生活中的精彩瞬间。
          </p>
        </div>
      </div>

      <!-- 核心功能 -->
      <div class="tech-card enhanced-border about-section">
        <div class="section-title">核心功能</div>
        <div class="section-content feature-list">
          <div class="feature-item">
            <el-icon><Calendar /></el-icon>
            <span>日程管理</span>
          </div>
          <div class="feature-item">
            <el-icon><Check /></el-icon>
            <span>打卡习惯</span>
          </div>
          <div class="feature-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>社区互动</span>
          </div>
          <div class="feature-item">
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </div>
          <div class="feature-item">
            <el-icon><Moon /></el-icon>
            <span>深色模式</span>
          </div>
          <div class="feature-item">
            <el-icon><Bell /></el-icon>
            <span>消息通知</span>
          </div>
        </div>
      </div>

      <!-- 开发团队 -->
      <div class="tech-card enhanced-border about-section">
        <div class="section-title">开发团队</div>
        <div class="section-content">
          <p>
            "时光"应用由一支充满热情的开发团队打造，团队成员均拥有丰富的移动应用开发经验。我们秉持"用心设计，用爱编码"的理念，致力于为用户提供简洁、实用、美观的应用体验。
          </p>
        </div>
      </div>

      <!-- 愿景使命 -->
      <div class="tech-card enhanced-border about-section">
        <div class="section-title">愿景与使命</div>
        <div class="section-content">
          <p class="vision">
            <strong>愿景：</strong>成为您日常生活中不可或缺的时间伙伴
          </p>
          <p class="mission">
            <strong>使命：</strong>帮助人们更好地规划时间，记录美好，分享生活
          </p>
        </div>
      </div>

      <!-- 许可与声明 -->
      <div class="tech-card enhanced-border about-section">
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
        <p>Copyright © 2024 alin776. All Rights Reserved.</p>
        <p>首次发布时间：2025年2月23日</p>
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
  Calendar,
  Check,
  ChatDotRound,
  User,
  Moon,
  Bell,
  Link,
} from "@element-plus/icons-vue";
import SpaceBackground from "./calendar/components/SpaceBackground.vue";

const router = useRouter();
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background-color: rgba(18, 18, 30, 0.9);
  color: white;
  position: relative;
  overflow-x: hidden;
  padding-bottom: 40px;
}

.about-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: transparent;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  width: 100%;
}

.back-icon {
  font-size: 20px;
  color: white;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
  transition: all 0.3s ease;
}

.back-icon:hover {
  transform: translateX(-3px);
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.7);
}

.about-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  flex: 1;
  color: white;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.7);
}

.about-container {
  padding: 0 16px 24px;
  max-width: 800px;
  margin: 0 auto;
}

.tech-card {
  background: rgba(30, 30, 40, 0.5);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  margin-bottom: 16px;
}

.enhanced-border {
  position: relative;
  z-index: 0;
}

.enhanced-border::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  padding: 2px;
  border-radius: 16px;
  background: linear-gradient(
    45deg,
    rgba(56, 189, 248, 0.6),
    rgba(147, 51, 234, 0.6)
  );
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
  text-align: center;
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
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.5);
  margin-bottom: 16px;
}

.app-logo img {
  width: 70%;
  height: 70%;
  object-fit: contain;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  margin: 8px 0;
  background: linear-gradient(45deg, #38bdf8, #9333ea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.4);
}

.app-version {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.app-slogan {
  font-size: 16px;
  color: #8b5cf6;
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.5);
}

.about-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  padding: 12px 16px;
  background: rgba(147, 51, 234, 0.2);
  text-shadow: 0 0 8px rgba(147, 51, 234, 0.5);
  font-weight: 500;
}

.section-content {
  padding: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.section-content p {
  margin: 0 0 12px;
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
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(147, 51, 234, 0.1);
  transition: all 0.3s;
}

.feature-item:hover {
  background: rgba(147, 51, 234, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(147, 51, 234, 0.3);
}

.feature-item .el-icon {
  font-size: 24px;
  color: #8b5cf6;
}

.vision,
.mission {
  padding: 10px;
  border-radius: 8px;
  background: rgba(147, 51, 234, 0.1);
  margin-bottom: 12px;
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
  padding: 16px 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.copyright-section p {
  margin: 4px 0;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: #8b5cf6;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(147, 51, 234, 0.1);
  transition: all 0.3s;
}

.github-link:hover {
  background: rgba(147, 51, 234, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 0 10px rgba(147, 51, 234, 0.4);
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
    padding: 0 12px 20px;
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
