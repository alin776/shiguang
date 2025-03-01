import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import UserProfileView from "../views/UserProfileView.vue";
import ProfileView from "../views/ProfileView.vue"; // Added ProfileView import
import CommunityView from "../views/CommunityView.vue";
import PostDetailView from "../views/PostDetailView.vue";
import MyPostsView from "../views/MyPostsView.vue";
import MyLikesView from "../views/MyLikesView.vue";
import FollowersView from "../views/FollowersView.vue";
import FollowingView from "../views/FollowingView.vue";

const routes = [
  {
    path: "/",
    redirect: "/calendar",
    meta: { requiresAuth: true },
  },
  {
    path: "/calendar",
    name: "Calendar",
    component: () => import("../views/CalendarView.vue"),
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
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/NotFoundView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory("/"),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) {
    next("/login");
  } else if (token && to.path === "/login") {
    next("/calendar");
  } else {
    next();
  }
});

export default router;
