const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const auth = require("../middleware/auth");

// 所有路由都需要认证
router.use(auth);

// 获取帖子列表
router.get("/posts", communityController.getPosts);

// 获取帖子详情
router.get("/posts/:postId", communityController.getPost);

// 创建帖子
router.post("/posts", communityController.createPost);

// 更新帖子
router.put("/posts/:postId", communityController.updatePost);

// 删除帖子
router.delete("/posts/:postId", communityController.deletePost);

// 上传图片
router.post("/upload", communityController.uploadImage);

// 创建评论
router.post("/posts/:postId/comments", communityController.createComment);

// 更新评论
router.put(
  "/posts/:postId/comments/:commentId",
  communityController.updateComment
);

// 删除评论
router.delete(
  "/posts/:postId/comments/:commentId",
  communityController.deleteComment
);

// 点赞帖子
router.post("/posts/:postId/like", communityController.likePost);

// 获取我的帖子
router.get("/my-posts", communityController.getMyPosts);

// 获取我点赞的帖子
router.get("/my-likes", communityController.getMyLikedPosts);

// 点赞评论
router.post(
  "/posts/:postId/comments/:commentId/like",
  communityController.likeComment
);

// 取消点赞评论
router.delete(
  "/posts/:postId/comments/:commentId/like",
  communityController.unlikeComment
);

// 回复评论
router.post(
  "/posts/:postId/comments/:commentId/replies",
  communityController.replyToComment
);

// 删除回复
router.delete("/replies/:replyId", communityController.deleteReply);

module.exports = router;
