const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const auth = require("../middleware/auth");
const db = require("../config/database");

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

// 举报帖子
router.post("/posts/:postId/report", communityController.reportPost);

// 举报评论
router.post("/comments/:commentId/report", communityController.reportComment);

// 获取帖子审核结果详情
router.get("/posts/:id/audit", async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    // 查询帖子信息
    const [posts] = await db.execute(
      `SELECT id, user_id, title, content, status, created_at, updated_at 
       FROM posts WHERE id = ? AND user_id = ?`,
      [postId, userId]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: '帖子不存在或无权查看' 
      });
    }
    
    // 查询审核记录（如果有审核系统的话）
    // 这里简单返回帖子信息
    const auditInfo = {
      id: posts[0].id,
      title: posts[0].title,
      content: posts[0].content,
      status: posts[0].status,
      audit_time: posts[0].updated_at, // 使用更新时间作为审核时间
      reason: '' // 这里可以从审核记录中获取拒绝原因
    };
    
    return res.json({
      success: true,
      data: auditInfo
    });
  } catch (error) {
    console.error('获取帖子审核详情失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取评论审核结果详情
router.get("/comments/:id/audit", async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;
    
    // 查询评论信息
    const [comments] = await db.execute(
      `SELECT c.id, c.user_id, c.content, c.status, c.created_at, c.updated_at, 
              p.id as post_id, p.title as post_title
       FROM comments c
       JOIN posts p ON c.post_id = p.id
       WHERE c.id = ? AND c.user_id = ?`,
      [commentId, userId]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: '评论不存在或无权查看' 
      });
    }
    
    // 查询审核记录（如果有审核系统的话）
    // 这里简单返回评论信息
    const auditInfo = {
      id: comments[0].id,
      content: comments[0].content,
      status: comments[0].status,
      post_id: comments[0].post_id,
      post_title: comments[0].post_title,
      audit_time: comments[0].updated_at, // 使用更新时间作为审核时间
      reason: '' // 这里可以从审核记录中获取拒绝原因
    };
    
    return res.json({
      success: true,
      data: auditInfo
    });
  } catch (error) {
    console.error('获取评论审核详情失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
