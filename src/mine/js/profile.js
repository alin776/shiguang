import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { useCommunityStore } from "../../stores/community";
import { ElMessageBox, ElMessage } from "element-plus";
import { useUnmountDetection } from "../../composables/useUnmountDetection";
import axios from "axios";
import { API_BASE_URL } from "../../config";

export default function useProfileLogic() {
  const router = useRouter();
  const authStore = useAuthStore();
  const communityStore = useCommunityStore();
  const { isMounted, checkMounted } = useUnmountDetection();

  // 用户数据
  const followingCount = ref(0);
  const followersCount = ref(0);
  const postsCount = ref(0);
  const posts = ref([]);
  const likedPosts = ref([]);
  const bio = ref("");
  const activeTab = ref("posts");
  const userId = ref("");
  const loading = ref(false);
  const totalLikesCount = ref(0); // 总获赞数
  const userLevel = ref(1); // 用户等级
  const currentExp = ref(0); // 当前级别已获得经验
  const expNeeded = ref(100); // 当前级别所需总经验
  const expProgress = ref(0); // 经验进度百分比
  const userTitle = ref(""); // 用户称号
  const userPoints = ref(0); // 用户积分

  // 计算属性
  const username = computed(() => authStore.user?.username || "");
  const email = computed(() => authStore.user?.email || "");
  const userAvatar = computed(() => authStore.userAvatar);
  const userInitials = computed(() => {
    const name = username.value;
    return name ? name.charAt(0).toUpperCase() : "";
  });
  const userCoverStyle = computed(() => {
    return {
      backgroundImage: `url(${authStore.userCover})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  });

  // 加载用户数据
  const loadUserStats = async () => {
    try {
      if (!checkMounted()) return;
      if (!authStore.user?.id) return;

      loading.value = true;
      userId.value = authStore.user.id;

      const response = await axios.get(
        `${API_BASE_URL}/api/users/${userId.value}/stats`,
        {
          headers: { Authorization: `Bearer ${authStore.token}` },
        }
      );

      console.log("用户统计API返回数据:", response.data);

      if (response.data.success) {
        const stats = response.data.data;
        followingCount.value = stats.followingCount || 0;
        followersCount.value = stats.followersCount || 0;
        postsCount.value = stats.postsCount || 0;
        bio.value = authStore.user.bio || "";
        userTitle.value = stats.title || ""; // 从API响应中获取用户称号
        console.log("用户称号:", userTitle.value);
        
        // 设置用户等级和经验信息
        if (stats.level !== undefined && stats.experienceProgress) {
          userLevel.value = stats.level;
          currentExp.value = stats.experienceProgress.currentExp;
          expNeeded.value = stats.experienceProgress.expNeeded;
          expProgress.value = stats.experienceProgress.progress;
        } else {
          // 如果后端还未返回经验信息，尝试单独获取
          await loadUserExperience();
        }
        
        // 加载用户积分信息
        await loadUserPoints();

        // 加载帖子和获赞数据
        await loadUserPosts();
        await loadLikedPosts();

        // 计算总获赞数
        calculateTotalLikes();
      }
    } catch (error) {
      console.error("获取用户统计数据失败:", error);
    } finally {
      loading.value = false;
    }
  };
  
  // 加载用户经验等级信息
  const loadUserExperience = async () => {
    try {
      // 从经验接口获取数据
      const response = await authStore.fetchUserExperience();
      
      userLevel.value = response.level;
      currentExp.value = response.experience - response.currentLevelExp;
      expNeeded.value = response.nextLevelExp - response.currentLevelExp;
      expProgress.value = response.progress;
      
      console.log("加载经验等级信息成功:", response);
    } catch (error) {
      console.error("加载经验等级信息失败:", error);
    }
  };

  // 加载用户帖子
  const loadUserPosts = async () => {
    try {
      const userIdValue = authStore.user?.id;
      if (!userIdValue) return;

      loading.value = true;
      const response = await communityStore.getUserPosts(userIdValue);

      // 处理帖子图片路径
      posts.value =
        response.posts?.map((post) => {
          // 确保图片路径是完整的URL
          if (post.images && post.images.length > 0) {
            post.images = post.images.map((img) => {
              if (!img) return null;
              
              console.log("处理帖子图片URL:", img);
              
              // 处理缺少路径分隔符的URL (http://localhost:3000post-xxx)
              if (img.includes("localhost:3000post-")) {
                const fileName = img.split("localhost:3000")[1];
                const fixedUrl = `${API_BASE_URL}/uploads/posts/${fileName}`;
                console.log("修复后的帖子图片URL:", fixedUrl);
                return fixedUrl;
              }
              
              // 处理正常URLs
              if (img.startsWith("http")) {
                return img;
              } 
              
              // 处理相对路径
              const url = img.startsWith("/") ? 
                `${API_BASE_URL}${img}` : 
                `${API_BASE_URL}/uploads/posts/${img}`;
              console.log("处理后的帖子图片URL:", url);
              return url;
            });
          }
          // 确保同时有likes_count和likesCount属性
          if (post.likes_count !== undefined && post.likesCount === undefined) {
            post.likesCount = post.likes_count;
          } else if (post.likesCount !== undefined && post.likes_count === undefined) {
            post.likes_count = post.likesCount;
          }
          return post;
        }) || [];

      // 设置帖子数量
      postsCount.value = posts.value.length;

      // 计算帖子总获赞数
      calculateTotalLikes();

      console.log("加载到的帖子数量:", posts.value.length);
      console.log("当前帖子数:", postsCount.value);
    } catch (error) {
      console.error("加载用户帖子失败:", error);
      ElMessage.error("加载帖子失败");
    } finally {
      loading.value = false;
    }
  };

  // 加载喜欢的帖子
  const loadLikedPosts = async () => {
    try {
      const userIdValue = authStore.user?.id;
      if (!userIdValue) return;

      loading.value = true;
      const response = await communityStore.getUserLikedPosts(userIdValue);

      // 处理帖子图片路径
      likedPosts.value =
        response.posts?.map((post) => {
          // 确保图片路径是完整的URL
          if (post.images && post.images.length > 0) {
            post.images = post.images.map((img) => {
              if (!img) return null;
              
              console.log("处理喜欢帖子图片URL:", img);
              
              // 处理缺少路径分隔符的URL (http://localhost:3000post-xxx)
              if (img.includes("localhost:3000post-")) {
                const fileName = img.split("localhost:3000")[1];
                const fixedUrl = `${API_BASE_URL}/uploads/posts/${fileName}`;
                console.log("修复后的喜欢帖子图片URL:", fixedUrl);
                return fixedUrl;
              }
              
              // 处理正常URLs
              if (img.startsWith("http")) {
                return img;
              } 
              
              // 处理相对路径
              const url = img.startsWith("/") ? 
                `${API_BASE_URL}${img}` : 
                `${API_BASE_URL}/uploads/posts/${img}`;
              console.log("处理后的喜欢帖子图片URL:", url);
              return url;
            });
          }
          // 确保同时有likes_count和likesCount属性
          if (post.likes_count !== undefined && post.likesCount === undefined) {
            post.likesCount = post.likes_count;
          } else if (post.likesCount !== undefined && post.likes_count === undefined) {
            post.likes_count = post.likesCount;
          }
          return post;
        }) || [];

      console.log("加载到的喜欢帖子数量:", likedPosts.value.length);
    } catch (error) {
      console.error("加载喜欢的帖子失败:", error);
      ElMessage.error("加载喜欢的帖子失败");
    } finally {
      loading.value = false;
    }
  };

  // 计算总获赞数
  const calculateTotalLikes = () => {
    // 计算所有帖子的获赞数总和
    const postLikes = posts.value.reduce((total, post) => {
      // 后端返回的是likes_count而不是likesCount
      const likeCount = post.likes_count || post.likesCount || 0;
      return total + likeCount;
    }, 0);

    // 设置总获赞数
    totalLikesCount.value = postLikes;
  };

  // 加载用户积分信息
  const loadUserPoints = async () => {
    try {
      if (!authStore.token) return;

      // 从积分接口获取数据
      const response = await authStore.fetchUserPoints();
      
      userPoints.value = response.points || 0;
      
      console.log("加载用户积分成功:", response);
    } catch (error) {
      console.error("加载用户积分失败:", error);
      // 如果API未就绪，尝试从本地用户数据获取积分
      userPoints.value = authStore.user?.points || 0;
    }
  };

  // 前往设置页面
  const goToSettings = () => {
    router.push("/settings");
  };

  const handleLogout = () => {
    ElMessageBox.confirm("确定要退出登录吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        authStore.logout();
        router.push("/login");
        ElMessage.success("已退出登录");
      })
      .catch(() => {});
  };

  const showAbout = () => {
    router.push("/about");
  };

  const formatTime = (time) => {
    const date = new Date(time);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")} ${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  onMounted(async () => {
    console.log("ProfileView mounted, 开始加载...");
    try {
      // 先获取完整的用户信息（包括封面图）
      await authStore.fetchUserInfo();
      console.log("用户信息已加载，封面图URL:", authStore.userCover);

      // 使用原来的loadUserStats函数加载用户数据
      await loadUserStats();
    } catch (error) {
      console.error("加载用户数据失败:", error);
    }
  });

  return {
    // 数据
    followingCount,
    followersCount,
    postsCount,
    posts,
    likedPosts,
    bio,
    activeTab,
    userId,
    loading,
    totalLikesCount,
    userLevel,
    currentExp,
    expNeeded,
    expProgress,
    userTitle,
    userPoints,

    // 计算属性
    username,
    userAvatar,
    userInitials,
    userCoverStyle,

    // 方法
    goToSettings,
    handleLogout,
    showAbout,
    formatTime,
    router,
  };
}
