<template>
  <div class="note-page no-extra-padding">
    <!-- 背景改为白色 -->
    <div class="white-background"></div>
    <div class="top-spacing"></div>
    <!-- 内容主体 -->
    <div class="note-content">
      <!-- 顶部标题栏 -->
      <div class="header-switch">
        <div class="switch-button" @click="toggleView">
          <div :class="['option', { active: currentView === 'note' }]">小记</div>
          <div :class="['divider']"></div>
          <div :class="['option', { active: currentView === 'calendar' }]">记事打卡</div>
        </div>
      </div>

      <!-- 日期显示 -->
      <div class="date-display">
        <div class="date-number">{{ currentDay }}</div>
        <div class="date-info">
          Mar.{{ currentYear }}
          <div class="location-weather">
            <span class="city-name">{{ city }}</span>·<span class="weather-status">{{ weather }}</span> {{ temperature }}
          </div>
        </div>
      </div>

      <!-- 卡片区域 - 使用swiper实现滑动效果 -->
      <div class="card-container">
        <swiper
          :slides-per-view="1"
          :space-between="0"
          :effect="'cards'"
          :modules="swiperModules"
          @swiper="onSwiper"
          @slideChange="onSlideChange"
          class="note-swiper"
        >
          <swiper-slide v-for="(note, index) in notes" :key="index" class="note-slide">
            <div class="note-card">
              <!-- 卡片图片 -->
              <div class="note-image-container" v-if="note.image">
                <img :src="note.image" :alt="note.author" class="note-image" @error="handleImageError" crossorigin="anonymous">
              </div>
              
              <!-- 卡片内容 -->
              <div class="note-text-container" 
                @touchstart="startTouch($event, note)"
                @touchend="endTouch"
                @touchmove="moveTouch"
                @touchcancel="cancelTouch">
                <div class="note-text">{{ note.content }}</div>
              </div>
              
              <!-- 卡片底部信息 -->
              <div class="note-footer">
                <div class="author-info">
                  <div class="author-avatar">
                    <el-avatar :size="36" :src="note.avatar" class="user-avatar" @error="() => true" crossorigin="anonymous">
                      {{ note.author ? note.author.charAt(0).toUpperCase() : 'U' }}
                    </el-avatar>
                  </div>
                  <div class="author-name">{{ note.author }}</div>
                </div>
                
                <div class="like-area" @click="likeNote(note.id)">
                  <el-icon class="like-icon" :class="{ 'liked': isNoteLiked(note.id) }">
                    <StarFilled v-if="isNoteLiked(note.id)" />
                    <Star v-else />
                  </el-icon>
                  <span class="like-count">{{ note.likes }}</span>
                </div>
              </div>
            </div>
          </swiper-slide>
        </swiper>
      </div>
    </div>
    
    <!-- 底部工具栏 -->
    <div class="bottom-tools">
      <div class="tool-button" @click="goToSubmitNote">
        <el-icon class="tool-icon"><EditPen /></el-icon>
      </div>
      <div class="tool-button" @click="showShareDialog">
        <el-icon class="tool-icon"><Share /></el-icon>
      </div>
    </div>

    <!-- 底部导航 -->
    <BottomNavBar />

    <!-- 分享对话框 -->
    <el-dialog
      v-model="shareDialogVisible"
      title="分享小记"
      width="90%"
      class="share-dialog"
      :before-close="closeShareDialog"
    >
      <div class="share-content">
        <div class="share-preview" ref="shareCardRef">
          <div class="share-card">
            <!-- 顶部信息条 -->
            <div class="share-header">
              <div class="share-date">{{ formatDate }}</div>
              <div class="share-location">{{ city }}{{ weather.value ? ' · ' + weather.value : '' }} {{ temperature }}</div>
            </div>
            
            <!-- 主要内容区域 -->
            <div class="share-note-content">
              <div v-if="currentNote && currentNote.image" class="share-image-container">
                <img :src="currentNote.image" class="share-image" alt="小记图片" @error="handleImageError" crossorigin="anonymous">
              </div>
              <div class="share-text">{{ currentNote ? currentNote.content : '' }}</div>
            </div>
            
            <!-- 摄影信息(如果有图片) -->
            <div class="share-photo-info" v-if="currentNote && currentNote.image">
              摄影 | {{ currentNote.author }}
            </div>
            
            <!-- 底部作者区 -->
            <div class="share-footer">
              <div class="share-author">
                <div class="share-author-name" v-if="currentNote">{{ currentNote.author }}</div>
              </div>
            </div>
            
            <!-- 应用标识 -->
            <div class="share-app-brand">
              <div class="app-logo-text">时光笔记</div>
              <div class="app-logo-slogan">CAPTURE YOUR MOMENTS</div>
              <div class="share-qrcode" ref="qrcodeRef"></div>
            </div>
          </div>
        </div>
        <div class="share-actions">
          <div class="share-tip">长按图片保存或分享给朋友</div>
          <div class="share-buttons">
            <el-button type="primary" @click="saveShareImage" :loading="generating">
              保存图片
            </el-button>
            <el-button @click="closeShareDialog">取消</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, nextTick, computed, onActivated } from "vue";
import { Autoplay, EffectCards } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import 'swiper/css/effect-cards';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from "vue-router";
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { testServerConnection } from '../utils/axios-interceptor';
import { API_BASE_URL } from '../config';
import { Star, StarFilled, EditPen, Notebook, Share } from "@element-plus/icons-vue";
// 移除原来的背景
// import SpaceBackground from "./calendar/components/SpaceBackground.vue";
import BottomNavBar from "../components/BottomNavBar.vue";
import { getImageUrl } from "../config/index"; // 导入图片URL处理函数

const router = useRouter();
const currentView = ref("note");
const currentNoteIndex = ref(0);
const swiperModules = [EffectCards];
const swiperInstance = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");
// 用于存储已点赞小记的ID集合
const likedNoteIds = ref(new Set());

// 从localStorage加载用户已点赞的小记ID
const loadLikedNotes = () => {
  try {
    const savedLikes = localStorage.getItem('likedNotes');
    if (savedLikes) {
      likedNoteIds.value = new Set(JSON.parse(savedLikes));
      console.log('已加载点赞状态:', Array.from(likedNoteIds.value));
    }
  } catch (error) {
    console.error('加载点赞状态失败:', error);
  }
};

// 检查小记是否已被点赞
const isNoteLiked = (noteId) => {
  return likedNoteIds.value.has(noteId.toString());
};

// 保存点赞状态到localStorage
const saveLikedNotes = () => {
  try {
    localStorage.setItem('likedNotes', JSON.stringify(Array.from(likedNoteIds.value)));
  } catch (error) {
    console.error('保存点赞状态失败:', error);
  }
};

// 绑定swiper实例
const onSwiper = (swiper) => {
  swiperInstance.value = swiper;
};

// 处理滑动变化
const onSlideChange = (swiper) => {
  currentNoteIndex.value = swiper.activeIndex;
  
  // 当用户滑动到最后一张或倒数第二张时，重新随机排序
  if (notes.value.length > 2 && swiper.activeIndex >= notes.value.length - 2) {
    // 保留当前笔记
    const currentNote = notes.value[swiper.activeIndex];
    
    // 随机打乱剩余的笔记
    const otherNotes = notes.value.filter((_, index) => index !== swiper.activeIndex);
    const shuffledOthers = shuffleArray(otherNotes);
    
    // 重建笔记数组：当前笔记放在第一位，后面是随机排序的其他笔记
    setTimeout(() => {
      if (swiperInstance.value) {
        // 将当前活动的笔记放在第一位
        notes.value = [currentNote, ...shuffledOthers];
        
        // 重置swiper位置到第一张
        swiperInstance.value.slideTo(0, 0, false);
      }
    }, 300); // 给一点延迟，等用户滑动完成
  }
};

// 页面加载时，设置整个文档背景为白色并只禁止水平滚动
onMounted(async () => {
  // 初始化页面
  currentView.value = "note";
  
  // 设置html和body为白色背景，但只禁止水平滚动
  document.documentElement.style.backgroundColor = '#ffffff';
  document.documentElement.style.overflowX = 'hidden';
  document.documentElement.style.overflowY = 'auto';
  document.documentElement.style.position = 'static'; // 移除固定定位
  
  document.body.style.backgroundColor = '#ffffff';
  document.body.style.overflowX = 'hidden';
  document.body.style.overflowY = 'auto';
  document.body.style.position = 'static'; // 移除固定定位
  document.body.style.touchAction = 'pan-y'; // 允许垂直触摸手势

  // 加载已点赞的小记ID
  loadLikedNotes();

  // 添加额外的延迟初始化，确保在移动设备上有足够时间完成初始化
  setTimeout(() => {
    initPageData();
  }, 100);

  // 在Capacitor环境中添加应用进入前台的监听
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    document.addEventListener('resume', handleAppResume);
    console.log('已添加应用恢复事件监听器');
  }
});

// 小记数据
const notes = ref([]);

// 从后端获取小记列表
const fetchNotes = async (forceRefresh = false) => {
  // 如果不是强制刷新且notes已有数据，则直接返回
  if (!forceRefresh && notes.value.length > 0 && !notes.value[0].isDefault) {
    console.log('已有小记数据，不重新获取');
    return;
  }

  try {
    console.log('开始获取小记数据...');
    isLoading.value = true;
    errorMessage.value = "";
    
    // 使用Date.now()作为参数防止缓存
    const timestamp = Date.now();
    
    // 判断是否为移动设备
    const isMobileApp = window.Capacitor && window.Capacitor.isNativePlatform();
    
    // 在移动设备上，增加请求超时设置
    let response;
    if (isMobileApp) {
      // 移动设备上使用更长的超时时间，对于网络请求更宽容
      response = await axios.get(`/api/notes?t=${timestamp}`, {
        timeout: 10000 // 10秒超时
      });
    } else {
      // 浏览器环境使用默认超时
      response = await axios.get(`/api/notes?t=${timestamp}`);
    }
    
    if (response.data.success && response.data.notes.length > 0) {
      console.log('后端返回的小记数据:', response.data.notes);
      
      // 将后端数据格式转换为前端需要的格式
      const formattedNotes = response.data.notes.map(note => {
        // 处理头像URL
        let avatarUrl = note.avatar;
        
        // 使用getImageUrl处理头像URL
        avatarUrl = avatarUrl ? getImageUrl(avatarUrl) : null;
        
        // 处理图片URL
        let imageUrl = note.image ? getImageUrl(note.image) : null;
        
        // 如果URL仍然无效或为空，使用默认头像
        const defaultAvatar = "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png";
        
        return {
          id: note._id,
          content: note.content,
          author: note.authorName,
          avatar: avatarUrl || defaultAvatar,
          likes: note.likes,
          timestamp: note.createdAt,
          image: imageUrl,
          isDefault: false // 标记为非默认数据
        };
      });
      
      // 随机打乱笔记顺序
      notes.value = shuffleArray(formattedNotes);
      console.log('成功加载数据库小记，数量:', notes.value.length);
      
      // 在移动设备上，将数据保存到localStorage作为备份
      if (isMobileApp) {
        try {
          localStorage.setItem('cachedNotes', JSON.stringify(notes.value));
          console.log('已将小记数据缓存到本地存储');
        } catch (e) {
          console.error('本地缓存小记失败:', e);
        }
      }
    } else {
      // 如果后端没有返回数据，检查是否有本地缓存
      if (isMobileApp) {
        try {
          const cachedData = localStorage.getItem('cachedNotes');
          if (cachedData) {
            notes.value = JSON.parse(cachedData);
            console.log('使用本地缓存的小记数据');
            return;
          }
        } catch (e) {
          console.error('读取本地缓存失败:', e);
        }
      }
      
      // 无本地缓存或非移动环境，使用默认数据
      console.log('后端没有返回小记数据，使用默认数据');
      useDefaultNotes();
    }
  } catch (error) {
    console.error('获取小记失败:', error);
    errorMessage.value = "获取小记失败，请稍后再试";
    
    // 在移动设备上尝试使用本地缓存
    const isMobileApp = window.Capacitor && window.Capacitor.isNativePlatform();
    if (isMobileApp) {
      try {
        const cachedData = localStorage.getItem('cachedNotes');
        if (cachedData) {
          notes.value = JSON.parse(cachedData);
          console.log('网络请求失败，使用本地缓存的小记数据');
          return;
        }
      } catch (e) {
        console.error('读取本地缓存失败:', e);
      }
    }
    
    // 使用默认数据作为后备
    useDefaultNotes();
  } finally {
    isLoading.value = false;
  }
};

// 使用默认的小记数据
const useDefaultNotes = () => {
  notes.value = shuffleArray([
    {
      id: 1,
      content: "怀着床榻的萌晖看下一张小记，我每时每刻都在填平希望的湖泊。",
      author: "阿多尼斯",
      avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
      likes: 5108,
      timestamp: "2025-03-16T10:30:00",
      image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format",
      isDefault: true // 标记为默认数据
    },
    {
      id: 2,
      content: "今天天气真好，阳光明媚，一起出去走走吧。",
      author: "alin",
      avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
      likes: 423,
      timestamp: "2025-03-16T09:15:00",
      image: "https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=800&auto=format",
      isDefault: true // 标记为默认数据
    },
    {
      id: 3,
      content: "写代码写到凌晨三点，终于解决了那个bug。成就感满满！",
      author: "alin",
      avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
      likes: 256,
      timestamp: "2025-03-15T03:10:00",
      image: null,
      isDefault: true // 标记为默认数据
    }
  ]);
  console.log('已加载默认小记');
};

// 检查并初始化页面数据
const initPageData = async () => {
  // 立即显示加载中状态，确保用户知道正在加载数据
  isLoading.value = true;
  
  // 首先检查是否是Capacitor环境（移动设备）
  const isMobileApp = window.Capacitor && window.Capacitor.isNativePlatform();
  console.log('环境检测:', isMobileApp ? '移动应用' : '浏览器');
  
  // 检查服务器连接
  try {
    // 如果是移动设备，增加超时重试次数
    let serverConnected = false;
    let retryCount = 0;
    const maxRetries = isMobileApp ? 2 : 1; // 移动设备多尝试一次
    
    while (!serverConnected && retryCount <= maxRetries) {
      try {
        console.log(`尝试连接服务器 (${retryCount + 1}/${maxRetries + 1})...`);
        serverConnected = await testServerConnection();
        if (serverConnected) {
          console.log('服务器连接成功');
          break;
        }
      } catch (error) {
        console.error(`第${retryCount + 1}次连接尝试失败:`, error);
      }
      retryCount++;
      if (retryCount <= maxRetries) {
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (serverConnected) {
      // 服务器连接成功，获取数据
      await fetchNotes(true);
    } else {
      // 服务器连接失败，使用默认数据
      console.log('服务器连接测试失败，使用默认数据');
      useDefaultNotes();
    }
  } catch (error) {
    console.error('服务器连接测试失败:', error);
    useDefaultNotes();
  } finally {
    // 确保无论如何都关闭加载状态
    isLoading.value = false;
  }
  
  // 获取位置和天气信息
  getLocationAndWeather();
};

// 添加onActivated生命周期钩子，确保从缓存激活时刷新数据
onActivated(() => {
  console.log('NoteView组件激活');
  initPageData();
});

// 添加单独的路由导航监听函数
const setupRouteGuard = () => {
  router.beforeEach((to, from, next) => {
    // 如果路由目标是NoteView
    if (to.name === 'note' || to.path === '/note') {
      console.log('路由导航到小记页面');
      // 先导航到页面
      next();
      // 然后刷新数据（在nextTick中以确保组件已挂载）
      nextTick(() => {
        if (typeof initPageData === 'function') {
          initPageData();
        }
      });
    } else {
      next();
    }
  });
};

// 调用路由守卫设置
setupRouteGuard();

// 随机打乱数组
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// 点赞功能
const likeNote = async (noteId) => {
  try {
    // 获取用户token
    const token = localStorage.getItem('token');
    if (!token) {
      ElMessage.warning('请先登录后再点赞');
      return;
    }

    console.log('点赞小记ID:', noteId); // 调试日志
    
    const response = await axios.post(`/api/notes/${noteId}/like`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.data.success) {
      // 更新当前点赞数
      const noteIndex = notes.value.findIndex(note => note.id === noteId);
      if (noteIndex !== -1) {
        notes.value[noteIndex].likes = response.data.likes;
        
        // 更新点赞状态
        const noteIdStr = noteId.toString();
        if (response.data.isLiked) {
          // 用户点赞了这条小记
          likedNoteIds.value.add(noteIdStr);
          ElMessage.success('点赞成功');
        } else {
          // 用户取消了点赞
          likedNoteIds.value.delete(noteIdStr);
          ElMessage.success('取消点赞成功');
        }
        
        // 保存点赞状态到本地存储
        saveLikedNotes();
      }
    } else {
      ElMessage.warning(response.data.message || '点赞操作未成功');
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    
    // 更详细的错误信息
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
      ElMessage.error(`点赞失败: ${error.response.data.message || '服务器错误'}`);
    } else if (error.request) {
      ElMessage.error('请求未收到响应，请检查网络连接');
    } else {
      ElMessage.error(`点赞失败: ${error.message}`);
    }
  }
};

// 长按复制功能
const touchStartTime = ref(0);
const touchTimer = ref(null);
const longPressDuration = 600; // 长按触发时间(毫秒)
const touchStartPos = ref({ x: 0, y: 0 });
const isTouchMoved = ref(false);

// 开始触摸
const startTouch = (e, note) => {
  // 防止在其他可点击元素上触发
  if (e.target.closest('.like-area') || e.target.closest('.author-info')) {
    return;
  }
  
  // 记录触摸开始时间和位置
  touchStartTime.value = Date.now();
  touchStartPos.value = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  isTouchMoved.value = false;
  
  // 保存当前元素引用，避免定时器回调中引用失效
  const textContainer = e.currentTarget;
  
  // 设置定时器
  touchTimer.value = setTimeout(() => {
    if (!isTouchMoved.value) {
      // 复制内容到剪贴板
      navigator.clipboard.writeText(note.content)
        .then(() => {
          ElMessage({
            message: '内容已复制到剪贴板',
            type: 'success',
            duration: 1500
          });
          
          // 添加视觉反馈 - 确保元素存在
          if (textContainer && textContainer.classList) {
            textContainer.classList.add('copy-flash');
            setTimeout(() => {
              // 再次检查元素是否仍然存在
              if (textContainer && textContainer.classList) {
                textContainer.classList.remove('copy-flash');
              }
            }, 300);
          }
        })
        .catch(err => {
          console.error('复制失败:', err);
          ElMessage.error('复制失败，请重试');
        });
    }
  }, longPressDuration);
};

// 结束触摸
const endTouch = () => {
  clearTimeout(touchTimer.value);
};

// 触摸移动
const moveTouch = (e) => {
  // 检测是否移动距离过大
  const moveX = Math.abs(e.touches[0].clientX - touchStartPos.value.x);
  const moveY = Math.abs(e.touches[0].clientY - touchStartPos.value.y);
  
  // 如果移动距离超过10px，视为滑动而非长按
  if (moveX > 10 || moveY > 10) {
    isTouchMoved.value = true;
    clearTimeout(touchTimer.value);
  }
};

// 取消触摸
const cancelTouch = () => {
  clearTimeout(touchTimer.value);
};

// 当前日期信息
const now = new Date();
const currentDay = computed(() => now.getDate());
const currentYear = computed(() => now.getFullYear());
const city = ref("获取中...");
const weather = ref("");
const temperature = ref("");
const weatherLoading = ref(true); // 添加天气加载状态

// 获取用户位置
const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 成功获取位置
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          resolve(coords);
        },
        (error) => {
          // 获取位置失败
          console.error('获取位置失败:', error.message);
          // 使用默认位置(上海)
          resolve({ latitude: 31.2304, longitude: 121.4737 });
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      console.error('浏览器不支持地理位置获取');
      // 使用默认位置(上海)
      resolve({ latitude: 31.2304, longitude: 121.4737 });
    }
  });
};

// 使用高德地图API获取位置信息和天气（免费）
const getLocationAndWeather = async () => {
  try {
    weatherLoading.value = true;
    // 首先获取用户位置
    const coords = await getUserLocation();
    
    // 使用高德地图API获取位置信息和天气
    // 高德Web服务API密钥
    const amapKey = 'befa0ffed41ad927740be7ecb415b49f'; // 用户提供的实际密钥
    
    // 1. 首先通过经纬度获取城市信息
    const locationResponse = await axios.get(`https://restapi.amap.com/v3/geocode/regeo`, {
      params: {
        key: amapKey,
        location: `${coords.longitude},${coords.latitude}`,
        extensions: 'base',
        output: 'json'
      }
    });
    
    if (locationResponse.data.status === '1') {
      const addressComponent = locationResponse.data.regeocode.addressComponent;
      // 直接从返回数据中获取城市名，避免空值
      let cityName = "";
      if (addressComponent.city && addressComponent.city.length > 0) {
        cityName = addressComponent.city;
      } else if (addressComponent.province && addressComponent.province.length > 0) {
        cityName = addressComponent.province;
      } else if (addressComponent.district && addressComponent.district.length > 0) {
        cityName = addressComponent.district;
      } else {
        cityName = "未知";
      }
      
      // 去除可能出现的方括号等特殊字符
      city.value = cityName.replace(/[\[\]]/g, '');
      
      console.log('城市名称:', city.value); // 调试信息
      
      // 2. 获取天气信息
      const weatherResponse = await axios.get(`https://restapi.amap.com/v3/weather/weatherInfo`, {
        params: {
          key: amapKey,
          city: addressComponent.adcode, // 使用行政区划编码
          extensions: 'base',
          output: 'json'
        }
      });
      
      if (weatherResponse.data.status === '1' && weatherResponse.data.lives.length > 0) {
        const weatherData = weatherResponse.data.lives[0];
        // 更新天气信息
        weather.value = weatherData.weather;
        temperature.value = `${weatherData.temperature}°C`;
        console.log('天气信息:', weather.value, temperature.value); // 调试信息
      } else {
        // 如果获取天气失败，清空天气信息
        weather.value = "";
        temperature.value = "";
      }
    } else {
      // 获取位置信息失败时使用默认数据
      city.value = "上海";
      weather.value = "";
      temperature.value = "";
    }
  } catch (error) {
    console.error('获取天气信息失败:', error);
    city.value = "上海";
    weather.value = "";
    temperature.value = "";
  } finally {
    weatherLoading.value = false;
  }
};

// 切换视图
const toggleView = () => {
  if (currentView.value === "note") {
    router.push("/calendar");
  } else {
    currentView.value = "note";
  }
};

// 跳转到投稿页面
const goToSubmitNote = () => {
  router.push("/note/submit");
};

// 分享相关
const shareDialogVisible = ref(false);
const shareCardRef = ref(null);
const qrcodeRef = ref(null);
const generating = ref(false);
const shareImageUrl = ref('');

// 当前选中的小记
const currentNote = computed(() => {
  if (notes.value.length === 0 || currentNoteIndex.value >= notes.value.length) {
    return null;
  }
  return notes.value[currentNoteIndex.value];
});

// 显示分享对话框
const showShareDialog = async () => {
  if (!currentNote.value) {
    ElMessage.warning('没有可分享的小记');
    return;
  }

  shareDialogVisible.value = true;

  // 等待DOM更新后生成二维码
  await nextTick();
  await generateQRCode();
};

// 关闭分享对话框
const closeShareDialog = () => {
  shareDialogVisible.value = false;
  shareImageUrl.value = '';
};

// 生成二维码
const generateQRCode = async () => {
  if (!qrcodeRef.value) return;

  try {
    const qrcodeSize = 80;
    // 生成指向应用下载页面或网站的二维码
    const appUrl = window.location.origin;
    
    // 清空之前的内容
    qrcodeRef.value.innerHTML = '';
    
    // 使用toDataURL替代toCanvas
    const qrcodeDataUrl = await QRCode.toDataURL(appUrl, {
      width: qrcodeSize,
      margin: 1,
      color: {
        dark: '#2c3e50',
        light: '#ffffff'
      }
    });
    
    // 创建图片元素
    const imgElem = document.createElement('img');
    imgElem.src = qrcodeDataUrl;
    imgElem.alt = "应用二维码";
    imgElem.style.width = "100%";
    imgElem.style.height = "auto";
    imgElem.style.maxWidth = `${qrcodeSize}px`;
    
    // 添加到容器
    qrcodeRef.value.appendChild(imgElem);
    
    // 在二维码下方添加提示文字
    const textElem = document.createElement('div');
    textElem.className = 'qrcode-tip';
    textElem.innerText = '扫码下载应用';
    qrcodeRef.value.appendChild(textElem);
  } catch (error) {
    console.error('生成二维码失败:', error);
    ElMessage.error('生成二维码失败');
  }
};

// 生成分享图片
const generateShareImage = async () => {
  if (!shareCardRef.value || !currentNote.value) return null;

  generating.value = true;
  try {
    // 给一点延迟确保DOM已渲染
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const canvas = await html2canvas(shareCardRef.value, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (document) => {
        // 确保所有图片都有crossorigin属性
        const images = document.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
          images[i].crossOrigin = 'anonymous';
        }
        return document;
      }
    });
    
    const imageUrl = canvas.toDataURL('image/png');
    generating.value = false;
    return imageUrl;
  } catch (error) {
    console.error('生成分享图片失败:', error);
    ElMessage.error('生成分享图片失败: ' + error.message);
    generating.value = false;
    return null;
  }
};

// 保存分享图片
const saveShareImage = async () => {
  if (generating.value) return;
  
  const imageUrl = await generateShareImage();
  if (!imageUrl) return;
  
  // 创建一个临时链接
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `小记-${new Date().getTime()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  ElMessage.success('图片已保存，请在相册中查看');
};

// 格式化日期为"YYYY / MM / DD"格式
const formatDate = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year} / ${month} / ${day}`;
});

// 图片加载错误处理
const handleImageError = (event) => {
  const imgSrc = event.target.src;
  console.error('图片加载失败:', imgSrc);
  
  // 简单使用默认占位图
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmMmYyZjIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IiM3ZjhjOGQiPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
  
  // 防止无限循环
  event.target.onerror = null;
};

// 测试网络请求函数
const testNetworkRequest = async () => {
  console.log('开始测试网络请求...');
  try {
    // 尝试测试服务器连接
    const result = await testServerConnection();
    console.log(`服务器连接测试结果: ${result ? '成功' : '失败'}`);
    
    // 额外发送一个真实的API请求
    try {
      console.log(`发送真实API请求到: ${API_BASE_URL}/api/notes`);
      const response = await axios.get(`${API_BASE_URL}/api/notes`, {
        params: { page: 1, limit: 1 }
      });
      console.log('API请求成功:', response.data);
    } catch (apiError) {
      console.error('API请求失败:', apiError);
    }
  } catch (error) {
    console.error('网络测试失败:', error);
  }
};

// 在组件卸载时移除监听器
onBeforeUnmount(() => {
  // 移除应用恢复事件监听器
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    document.removeEventListener('resume', handleAppResume);
  }
});

// 处理应用从后台恢复到前台的事件
const handleAppResume = () => {
  console.log('应用从后台恢复，刷新小记数据');
  // 强制刷新数据
  initPageData();
};

// 添加页面返回时的处理
const handlePageReturn = () => {
  // 检查数据是否需要刷新
  if (notes.value.length === 0 || notes.value[0].isDefault) {
    console.log('检测到返回页面且无有效数据，强制刷新');
    initPageData();
  }
};

// 创建处理返回导航的函数
const setupRouteReturnHandler = () => {
  router.afterEach((to, from) => {
    // 如果导航来自其他页面
    if (to.path === '/note' && from.path !== '/note') {
      console.log('检测到返回小记页面', from.path, '->', to.path);
      nextTick(() => {
        handlePageReturn();
      });
    }
  });
};

// 初始化路由返回处理
setupRouteReturnHandler();
</script>

<style scoped>
.note-page {
  min-height: 100vh;
  height: auto; /* 允许高度自适应内容 */
  position: relative; /* 改回相对定位，允许滚动 */
  display: flex;
  flex-direction: column;
  text-align: left;
  background-color: #ffffff;
  overflow-x: hidden; /* 只禁止水平滚动 */
  overflow-y: auto; /* 允许垂直滚动 */
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  touch-action: pan-y; /* 允许垂直滑动，禁止水平滑动 */
  padding-top: var(--safe-area-top); /* 添加顶部安全区域 */
}

.top-spacing {
  height: 20px;
  width: 100%;
  background-color: #f8f9fa;
}
.white-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background-color: #ffffff;
  z-index: -10;
}

.note-content {
  padding: 0 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  z-index: 1;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden; /* 只禁止水平滚动 */
  overflow-y: visible; /* 允许垂直滚动 */
  touch-action: pan-y; /* 允许垂直滑动，禁止水平滑动 */
  justify-content: space-between; /* 均匀分布内容 */
}

/* 顶部标题栏和切换按钮 */
.header-switch {
  display: flex;
  justify-content: center;
  padding: 10px 0; /* 减少上下间距 */
  margin-top: 5px; /* 减少顶部间距 */
  width: 100%;
  overflow: visible;
  position: relative;
  z-index: 100;
}

.switch-button {
  display: flex;
  background-color: rgba(242, 242, 242, 0.8);
  border-radius: 20px;
  padding: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(236, 240, 241, 0.9);
  overflow: hidden;
}

.option {
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  color: #7f8c8d;
  transition: all 0.3s ease;
  border-radius: 18px;
  white-space: nowrap;
}

.option.active {
  background-color: #2c3e50;
  color: white;
  font-weight: 500;
}

.divider {
  width: 1px;
  background-color: #e0e0e0;
  margin: 8px 0;
}

/* 日期显示 */
.date-display {
  display: flex;
  align-items: center;
  margin: 5px 0; /* 进一步减少上下间距 */
}

.date-number {
  font-size: 60px;
  font-weight: 800;
  line-height: 1;
  color: #2c3e50;
  margin-right: 15px;
  /* 提高字体清晰度 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* 防止文本模糊 */
  transform: translateZ(0);
  /* 防止字体缩放导致的模糊 */
  text-rendering: optimizeLegibility;
}

.date-info {
  font-size: 16px;
  color: #34495e;
  font-weight: 500;
  margin-bottom: 5px;
  /* 提高字体清晰度 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.location-weather {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 4px;
  font-weight: normal;
  /* 提高字体清晰度 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.city-name {
  font-weight: 500;
}

.weather-status {
  font-weight: 500;
}

/* 卡片容器 */
.card-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* 改为center使卡片居中对齐 */
  position: relative;
  width: 100%;
  padding-top: 0; /* 移除顶部间距 */
  overflow-x: hidden; /* 只禁止水平溢出 */
  overflow-y: visible; /* 允许垂直溢出 */
  touch-action: pan-y; /* 允许垂直方向的触摸手势 */
}

.note-swiper {
  width: 100%;
  height: 60vh; /* 保持现有高度 */
  max-width: 100%;
  margin: 0 auto;
  overflow: visible;
}

.note-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

/* 修改Swiper卡片效果样式 */
:deep(.swiper-cards) {
  overflow: visible;
  touch-action: pan-y; /* 只允许垂直方向的触摸手势 */
}

:deep(.swiper-wrapper) {
  overflow: visible !important;
  touch-action: pan-y; /* 只允许垂直方向的触摸手势 */
}

/* 移除卡片堆叠中后方卡片的阴影遮罩 */
:deep(.swiper-slide) {
  opacity: 0 !important; /* 隐藏非活动卡片 */
}

:deep(.swiper-slide-active) {
  opacity: 1 !important; /* 只显示当前活动卡片 */
}

:deep(.swiper-slide-shadow-left),
:deep(.swiper-slide-shadow-right),
:deep(.swiper-slide-shadow-top),
:deep(.swiper-slide-shadow-bottom) {
  display: none !important; /* 移除所有方向的阴影 */
}

.note-card {
  width: 94%;
  height: 99%; /* 增加高度，从98%修改为99% */
  margin: 0 auto;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  /* 防止缩放和渲染问题 */
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  /* 优化字体渲染 */
  text-rendering: optimizeLegibility;
  /* 确保元素使用硬件加速 */
  will-change: transform;
  /* 修复边缘锯齿 */
  perspective: 1000px;
}

.note-image-container {
  width: 100%;
  height: 240px; /* 设置固定高度而非百分比 */
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: #f5f5f5;
}

.note-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 改为cover确保填充整个容器 */
  object-position: center; /* 确保图片居中显示 */
  background-color: #f5f5f5;
  transition: all 0.3s ease;
}

.note-text-container {
  padding: 16px 20px; /* 修改内边距，增加左右两侧间距 */
  flex: 1; /* 保持flex:1使文字区域自动占据剩余空间 */
  min-height: 30%; /* 添加最小高度确保文字区域足够大 */
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
  transition: background-color 0.3s;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* 复制时的闪烁效果 */
.copy-flash {
  background-color: rgba(44, 62, 80, 0.1);
  animation: flash-animation 0.3s;
}

@keyframes flash-animation {
  0% { background-color: transparent; }
  50% { background-color: rgba(44, 62, 80, 0.2); }
  100% { background-color: rgba(44, 62, 80, 0.1); }
}

.note-text {
  font-size: 17px;
  line-height: 1.8;
  color: #333333;
  font-weight: 400;
  text-align: left;
  white-space: pre-line;
  font-family: 'STSong', 'SimSun', 'FangSong', serif;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  /* 提高字体清晰度 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* 防止文本模糊 */
  transform: translateZ(0);
  /* 确保文本使用整数像素 */
  transform-style: preserve-3d;
  /* 防止字体缩放导致的模糊 */
  text-rendering: optimizeLegibility;
}

.note-footer {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  display: flex;
  align-items: center;
}

.user-avatar {
  border: 1px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  width: 28px !important;
  height: 28px !important;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  /* 提高字体清晰度 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transform: translateZ(0);
}

.like-area {
  display: flex;
  align-items: center;
  gap: 3px;
  background-color: rgba(240, 240, 240, 0.8);
  padding: 4px 10px;
  border-radius: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.like-icon {
  font-size: 14px;
  color: #e74c3c;
}

.like-icon.liked {
  color: #e74c3c;
  transform: scale(1.1);
}

.like-count {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  /* 提高字体清晰度 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transform: translateZ(0);
}

/* 底部工具栏 */
.bottom-tools {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 20px;
  background-color: transparent;
  border-top: none;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 10;
  gap: 50px;
  margin-top: -35px;
}

.tool-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f5f7fa;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  background-color: #e8f3ff;
}

.tool-icon {
  font-size: 20px;
  color: #2c3e50;
}

/* 防止触摸事件冲突 */
:deep(.swiper) {
  touch-action: pan-x; /* 允许水平滑动 */
}

:deep(.swiper-slide) {
  touch-action: pan-x; /* 允许水平滑动 */
}

/* 响应式调整 */
@media screen and (max-width: 480px) {
  .date-number {
    font-size: 48px;
  }
  
  .note-swiper {
    height: 55vh; /* 在小屏幕上调整高度，确保卡片位于视口中央 */
  }
  
  .option {
    padding: 7px 14px;
    font-size: 13px;
  }
  
  .bottom-tools {
    padding: 5px 12px;
  }
  
  .note-card {
    width: 92%;
    height: 96%; /* 略微减小高度，确保在小屏幕上看起来更居中 */
  }
  
  .note-text-container {
    padding: 12px 16px; /* 在小屏幕上适当调整内边距 */
  }
}

/* 分享对话框样式 */
.share-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.share-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.share-preview {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.share-card {
  width: 100%;
  max-width: 375px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 0;
  position: relative;
}

.share-header {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: #ffffff;
}

.share-date {
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
  font-family: 'STSong', 'SimSun', serif;
}

.share-location {
  font-size: 16px;
  font-weight: 400;
  color: #2c3e50;
  text-align: right;
  font-family: 'STSong', 'SimSun', serif;
}

.share-note-content {
  width: 100%;
}

.share-image-container {
  width: 100%;
  height: 280px;
  overflow: hidden;
  position: relative;
  background-color: #f5f5f5; /* 添加背景色 */
}

.share-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #f5f5f5; /* 添加背景色 */
  transition: opacity 0.3s; /* 添加过渡效果 */
}

.share-photo-info {
  font-size: 12px;
  color: #999;
  padding: 6px 20px;
  text-align: left;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-weight: 300;
  letter-spacing: 0.5px;
}

.share-text {
  font-size: 17px;
  line-height: 1.8;
  color: #333333;
  padding: 20px;
  white-space: pre-line;
  text-align: left;
  font-family: 'STSong', 'SimSun', 'FangSong', serif;
  font-weight: 400;
  letter-spacing: 0.5px;
  /* 提高字体清晰度 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* 防止文本模糊 */
  transform: translateZ(0);
  /* 防止字体缩放导致的模糊 */
  text-rendering: optimizeLegibility;
}

.share-footer {
  padding: 0 20px 20px;
  display: flex;
  justify-content: flex-start;
}

.share-author-name {
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
  font-family: 'STSong', 'SimSun', serif;
}

.share-app-brand {
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background-color: #ffffff;
}

.app-logo-text {
  font-size: 22px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  font-family: 'STSong', 'SimSun', serif;
  letter-spacing: 1px;
}

.app-logo-slogan {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 4px;
  margin-bottom: 16px;
  text-align: center;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: 2px;
}

.share-qrcode {
  width: 90px;
  height: 90px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.qrcode-tip {
  font-size: 10px;
  color: #7f8c8d;
  margin-top: 4px;
  text-align: center;
  font-family: 'STSong', 'SimSun', serif;
}

.share-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.share-tip {
  font-size: 14px;
  color: #7f8c8d;
  text-align: center;
  font-family: 'STSong', 'SimSun', serif;
}

.share-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .share-card {
    max-width: 100%;
  }
}

/* 图片加载错误提示 */
.image-load-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 2;
}
</style> 