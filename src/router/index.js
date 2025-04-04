import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import UserProfileView from "../views/UserProfileView.vue";
import ProfileView from "../views/ProfileView.vue"; // Added ProfileView import
import CommunityView from "../views/CommunityView.vue";
import { PostDetailView } from "../views/post";
import MyPostsView from "../views/MyPostsView.vue";
import MyLikesView from "../views/MyLikesView.vue";
import FollowersView from "../views/FollowersView.vue";
import FollowingView from "../views/FollowingView.vue";
import CalendarSettingsView from "../views/calendar/CalendarSettingsView.vue";
import CalendarView from "../views/calendar/CalendarView.vue";
import CalendarEventView from "../views/calendar/CalendarEventView.vue";
import CalendarStatisticsView from "../views/calendar/statistics/StatisticsView.vue";
import NoteView from "../views/NoteView.vue"; // 添加小记页面组件导入
import SubmitNoteView from "../views/SubmitNoteView.vue"; // 添加小记投稿页面组件导入
import AboutView from "../views/AboutView.vue";
import CreatePostView from "../views/CreatePostView.vue"; // 添加发布帖子页面组件导入
import VersionHistory from "../views/VersionHistory.vue"; // 添加版本历史页面组件导入
import TaskCenterView from "../views/TaskCenterView.vue"; // 添加任务中心页面组件导入
import TitleGuideView from "../views/TitleGuideView.vue"; // 添加称号指南页面组件导入
import ActivityListView from "../views/activities/ActivityListView.vue"; // 添加活动列表页面组件导入
import ActivityDetailView from "../views/activities/ActivityDetailView.vue"; // 添加活动详情页面组件导入
import PointsExchangeView from "../views/PointsExchangeView.vue"; // 添加积分兑换页面组件导入
import CardGameView from "../views/CardGameView.vue"; // 添加卡牌游戏页面组件导入
import AdView from "../views/AdView.vue"; // 添加广告页面组件导入
import PointsHistoryView from "../views/points/PointsHistoryView.vue"; // 添加积分明细页面组件导入
import RatePostsView from "../views/RatePostsView.vue";
import RatePostDetailView from "../views/RatePostDetailView.vue";
import OptionDetailView from "../views/OptionDetailView.vue"; // 添加选项详情页面组件导入
import CreateRatePostView from "../views/CreateRatePostView.vue";
import ForumCategoriesView from "../views/ForumCategoriesView.vue"; // 添加论坛板块页面组件导入
import PrivateChatListView from "../views/PrivateChatListView.vue"; // 添加私聊列表页面组件导入
import PrivateChatView from "../views/PrivateChatView.vue"; // 添加私聊详情页面组件导入
import { ref } from "vue";

const routes = [
  {
    path: "/",
    redirect: "/note",
    meta: { requiresAuth: true },
  },
  {
    path: "/calendar",
    name: "Calendar",
    component: CalendarView,
    meta: { requiresAuth: true },
  },
  {
    path: "/note",
    name: "Note",
    component: NoteView,
    meta: { requiresAuth: true },
  },
  {
    path: "/note/submit",
    name: "NoteSubmit",
    component: SubmitNoteView,
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterView,
    meta: { requiresAuth: false },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: () => import("../views/ForgotPasswordView.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("@/views/UserSettingsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "profile",
    component: ProfileView,
  },
  {
    path: "/feedback",
    name: "Feedback",
    component: () => import("@/views/FeedbackView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/town",
    name: "Town",
    component: () => import("@/views/TownView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/notifications",
    name: "Notifications",
    component: () => import("@/views/NotificationsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/announcements",
    name: "Announcements",
    component: () => import("@/views/AnnouncementsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/announcements/:id",
    name: "AnnouncementDetail",
    component: () => import("@/views/AnnouncementsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/community",
    name: "Community",
    component: CommunityView,
    meta: { requiresAuth: true },
  },
  {
    path: "/community/categories",
    name: "ForumCategories",
    component: ForumCategoriesView,
    meta: { 
      requiresAuth: true,
      title: "论坛板块"
    },
  },
  {
    path: "/community/create",
    name: "CreatePost",
    component: CreatePostView,
    meta: { requiresAuth: true },
  },
  {
    path: "/community/post/:id",
    name: "PostDetail",
    component: PostDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: "/user/:id/posts",
    name: "UserPosts",
    component: () => import("../views/MyPostsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/user/:id/likes",
    name: "UserLikes",
    component: () => import("../views/MyLikesView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/user/:id",
    name: "UserProfile",
    component: UserProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: "/followers",
    name: "Followers",
    component: FollowersView,
    meta: { requiresAuth: true },
  },
  {
    path: "/following",
    name: "Following",
    component: FollowingView,
    meta: { requiresAuth: true },
  },
  {
    path: "/user/:id/followers",
    name: "UserFollowers",
    component: FollowersView,
    meta: { requiresAuth: true },
  },
  {
    path: "/user/:id/following",
    name: "UserFollowing",
    component: FollowingView,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile/edit",
    name: "EditProfile",
    component: () => import("../views/EditProfileView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/change-password",
    name: "ChangePassword",
    component: () => import("../views/ChangePasswordView.vue"),
    meta: {
      requiresAuth: true,
      title: "修改密码",
    },
  },
  {
    path: "/calendar/settings",
    name: "CalendarSettings",
    component: CalendarSettingsView,
    meta: { requiresAuth: true },
  },
  {
    path: "/calendar/event/:id",
    name: "CalendarEvent",
    component: CalendarEventView,
    meta: { requiresAuth: true },
  },
  {
    path: "/calendar/event/new",
    name: "NewCalendarEvent",
    component: CalendarEventView,
    meta: { requiresAuth: true },
  },
  {
    path: "/calendar/statistics",
    name: "CalendarStatistics",
    component: CalendarStatisticsView,
    meta: { requiresAuth: true },
  },
  {
    path: "/about",
    name: "About",
    component: AboutView,
    meta: {
      requiresAuth: true,
      title: "关于我们",
    },
  },
  {
    path: "/version-history",
    name: "VersionHistory",
    component: VersionHistory,
    meta: { requiresAuth: false },
  },
  {
    path: "/task-center",
    name: "TaskCenter",
    component: TaskCenterView,
    meta: { 
      requiresAuth: true,
      title: "任务中心"
    },
  },
  {
    path: "/title-guide",
    name: "TitleGuide",
    component: TitleGuideView,
    meta: { 
      requiresAuth: true,
      title: "称号指南"
    },
  },
  {
    path: "/activities",
    name: "activities",
    component: ActivityListView,
    meta: { requiresAuth: true },
  },
  {
    path: "/activities/:id",
    name: "activity-detail",
    component: ActivityDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: "/points/exchange",
    name: "PointsExchange",
    component: PointsExchangeView,
    meta: { 
      requiresAuth: true,
      title: "积分兑换" 
    },
  },
  {
    path: "/points/history",
    name: "PointsHistory",
    component: PointsHistoryView,
    meta: { requiresAuth: true },
  },
  {
    path: "/games/card-game",
    name: "CardGame",
    component: CardGameView,
    meta: {
      requiresAuth: true,
      title: "每日抽奖"
    },
  },
  {
    path: "/ad",
    name: "ad",
    component: AdView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/rate-posts",
    name: "RatePosts",
    component: RatePostsView,
    meta: { 
      requiresAuth: true,
      title: "评分广场"
    },
  },
  {
    path: "/rate-posts/:id",
    name: "RatePostDetail",
    component: RatePostDetailView,
    meta: { 
      requiresAuth: true 
    },
  },
  {
    path: "/rate-posts/:id/options/:optionId",
    name: "OptionDetail",
    component: OptionDetailView,
    meta: { 
      requiresAuth: true,
      title: "选项详情"
    },
  },
  {
    path: "/rate-posts/create",
    name: "CreateRatePost",
    component: CreateRatePostView,
    meta: { 
      requiresAuth: true,
      title: "创建评分贴"
    },
  },
  {
    path: "/private-chats",
    name: "PrivateChats",
    component: PrivateChatListView,
    meta: { 
      requiresAuth: true, 
      title: "私聊列表"
    },
  },
  {
    path: "/private-chat/:id",
    name: "PrivateChat",
    component: PrivateChatView,
    meta: { 
      requiresAuth: true, 
      title: "私聊对话"
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/NotFoundView.vue"),
  },
];

// 全局加载状态
export const isRouteLoading = ref(false);

const router = createRouter({
  history: createWebHistory("/"),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  isRouteLoading.value = true;
  const token = localStorage.getItem("token");

  if (to.meta.requiresAuth && !token) {
    next("/login");
  } else if (token && to.path === "/login") {
    next("/note");
  } else {
    // 添加小延迟，避免快速导航造成的组件更新问题
    setTimeout(() => {
      next();
    }, 50);
  }
});

router.afterEach(() => {
  // 导航完成后重置加载状态
  setTimeout(() => {
    isRouteLoading.value = false;
  }, 100);
});

export default router;
