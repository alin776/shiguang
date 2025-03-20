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

// 上传音频
router.post("/upload-audio", communityController.uploadAudio);

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

// 取消点赞帖子
router.delete("/posts/:postId/like", communityController.likePost);

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

// 获取我的表情包
router.get("/emojis", communityController.getUserEmojis);

// 添加表情包
router.post("/emojis", communityController.addEmoji);

// 删除表情包
router.delete("/emojis/:emojiId", communityController.deleteEmoji);

module.exports = router;
