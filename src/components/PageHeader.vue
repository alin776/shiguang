<template>
  <div class="page-header-container">
    <div class="page-header">
      <div class="center-section">
        <h1 class="title">{{ title }}</h1>
      </div>
      <div class="right-section">
        <slot name="right"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

defineProps({
  title: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.page-header-container {
  width: 100%;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
}

.right-section {
  width: 40px;
  display: flex;
  align-items: center;
}

.center-section {
  flex: 1;
  text-align: center;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}
</style> 