<template>
  <div class="post-container">
    <!-- 图片轮播 -->
    <div class="post-images" v-if="post.images?.length">
      <div class="image-slider">
        <div class="slider-arrows">
          <div
            class="arrow left"
            @click="prevImage"
            v-if="post.images.length > 1"
          >
            <el-icon><ArrowLeft /></el-icon>
          </div>
          <div
            class="arrow right"
            @click="nextImage"
            v-if="post.images.length > 1"
          >
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
        <img
          :src="post.images[currentImageIndex]"
          :alt="post.title"
          class="main-image"
        />
        <div class="image-indicator" v-if="post.images.length > 1">
          {{ currentImageIndex + 1 }}/{{ post.images.length }}
        </div>
      </div>
    </div>

    <!-- 帖子内容 -->
    <div class="post-content">
      <h3 class="post-title">{{ post.title }}</h3>
      <p class="post-text">{{ post.content }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

const currentImageIndex = ref(0);

const prevImage = () => {
  if (props.post.images?.length > 1) {
    currentImageIndex.value =
      currentImageIndex.value === 0
        ? props.post.images.length - 1
        : currentImageIndex.value - 1;
  }
};

const nextImage = () => {
  if (props.post.images?.length > 1) {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % props.post.images.length;
  }
};
</script>

<style scoped>
.post-container {
  margin-bottom: 16px;
}

.post-images {
  overflow: hidden;
  background: #f0f0f0;
  max-height: 50vh;
}

.image-slider {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.main-image {
  width: 100%;
  display: block;
  object-fit: contain;
  background: #000;
  max-height: 50vh;
}

.slider-arrows {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
}

.arrow {
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  margin: 0 12px;
}

.image-indicator {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.post-content {
  padding: 16px;
  background-color: var(--card-bg);
}

.post-title {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 18px;
  color: var(--text-color);
}

.post-text {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: var(--text-color);
  margin: 0;
}
</style>
