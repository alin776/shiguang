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
    path: "/community",
    name: "Community",
    component: CommunityView,
    meta: { requiresAuth: true },
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
    next("/calendar");
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
