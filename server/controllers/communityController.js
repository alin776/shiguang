const { validationResult } = require("express-validator");
const db = require("../config/database");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { createNotification } = require("../controllers/notificationController");
const taskController = require('./taskController');

// 确保上传目录存在
const uploadDir = "public/uploads/posts";
const audioDir = "public/uploads/audio";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// 配置图片上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "post-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    console.log("上传文件类型:", file.mimetype);
    
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
      cb(null, true);
    } else {
      console.error("不支持的文件类型:", file.mimetype);
      cb(new Error("只允许上传JPG或PNG格式的图片"));
    }
  },
}).single("file"); // Element Plus Upload 组件默认使用 'file' 作为字段名

// 配置音频上传
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "audio-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传音频文件"));
    }
  },
}).single("audio");

exports.getPosts = async (req, res) => {
  try {
    let { page = 1, limit = 20, sort = "latest", search = "", category_id } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    // 构建基础查询
    let query = `
      SELECT 
        p.id, p.user_id, p.title, p.content, p.views, p.likes, 
        p.created_at, p.images, p.category_id, u.username,
        CASE 
          WHEN u.avatar IS NOT NULL AND u.avatar != '' 
          THEN CONCAT('http://localhost:3000/uploads/avatars/', u.avatar)
          ELSE NULL 
        END as avatar,
        u.id as author_id,
        c.name as category_name,
        COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'approved'), 0) as comments_count,
        COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id), 0) as likes_count,
        IF(EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?), 1, 0) as is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'approved'
    `;

    const queryParams = [req.user.id];

    // 添加搜索条件
    if (search.trim()) {
      query += ` AND (p.title LIKE ? OR p.content LIKE ?)`;
      const searchPattern = `%${search.trim()}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // 添加分类筛选
    if (category_id) {
      query += ` AND p.category_id = ?`;
      queryParams.push(category_id);
    }

    // 添加排序条件
    query += ` ORDER BY `;
    switch (sort) {
      case "hot":
        query += `p.likes DESC`;
        break;
      case "recommend":
        query += `p.views DESC`;
        break;
      case "latest":
      default:
        query += `p.created_at DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    // 获取帖子总数
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM posts p 
      WHERE p.status = 'approved'
    `;

    const countParams = [];

    // 添加搜索条件到计数查询
    if (search.trim()) {
      countQuery += ` AND (p.title LIKE ? OR p.content LIKE ?)`;
      const searchPattern = `%${search.trim()}%`;
      countParams.push(searchPattern, searchPattern);
    }

    // 添加分类筛选到计数查询
    if (category_id) {
      countQuery += ` AND p.category_id = ?`;
      countParams.push(category_id);
    }

    const [countResult] = await db.execute(
      countQuery,
      countParams
    );

    const [posts] = await db.query(query, queryParams);

    // 处理每个帖子的图片数据
    const processedPosts = posts.map((post) => {
      let parsedImages = [];
      try {
        if (post.images && typeof post.images === "string") {
          parsedImages = JSON.parse(post.images);
        } else if (Array.isArray(post.images)) {
          parsedImages = post.images;
        }
      } catch (error) {
        console.error("解析图片数据失败:", error);
        parsedImages = [];
      }

      return {
        ...post,
        user: {
          id: post.author_id,
          username: post.username || "匿名用户",
          avatar: post.avatar || null,
        },
        images: parsedImages,
        is_liked: Boolean(post.is_liked),
      };
    });

    res.json({
      posts: processedPosts,
      pagination: {
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error("获取帖子列表错误:", error);
    res.status(500).json({ message: "获取帖子列表失败" });
  }
};

exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user.id;

    // 获取帖子详情
    const [posts] = await db.execute(
      `SELECT 
        p.*,
        u.username,
        u.avatar,
        u.id as author_id,
        c.id as category_id,
        c.name as category_name,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = u.id) as is_following,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND (p.status = 'approved' OR p.user_id = ?)`,
      [currentUserId, currentUserId, postId, currentUserId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: "帖子不存在或未通过审核" });
    }

    const post = {
      ...posts[0],
      user: {
        id: posts[0].author_id,
        username: posts[0].username || "匿名用户",
        avatar: posts[0].avatar,
        is_following: Boolean(posts[0].is_following),
      },
      category: posts[0].category_id ? {
        id: posts[0].category_id,
        name: posts[0].category_name
      } : null,
      is_liked: Boolean(posts[0].is_liked),
      images: (() => {
        if (!posts[0].images) return [];
        try {
          if (typeof posts[0].images === 'string') {
            return JSON.parse(posts[0].images);
          } else if (Array.isArray(posts[0].images)) {
            return posts[0].images;
          }
          return [];
        } catch (error) {
          console.error('解析帖子图片数据失败:', error);
          return [];
        }
      })()
    };

    // 获取评论及其点赞和回复信息
    const [comments] = await db.execute(
      `SELECT 
        c.*,
        u.username,
        u.avatar,
        u.id as author_id,
        EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = ?) as is_liked,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND (c.status = 'approved' OR c.user_id = ?)
      ORDER BY c.created_at DESC`,
      [currentUserId, postId, currentUserId]
    );

    // 获取评论的回复
    for (let comment of comments) {
      const [replies] = await db.execute(
        `SELECT 
          r.*,
          u.username as user_username,
          u.avatar as user_avatar,
          ru.username as reply_to_username
        FROM comment_replies r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN users ru ON r.reply_to_id = ru.id
        WHERE r.comment_id = ?
        ORDER BY r.created_at ASC`,
        [comment.id]
      );

      comment.replies = replies.map((reply) => ({
        ...reply,
        user: {
          id: reply.user_id,
          username: reply.user_username,
          avatar: reply.user_avatar,
        },
        replyTo: reply.reply_to_id
          ? {
              id: reply.reply_to_id,
              username: reply.reply_to_username,
            }
          : null,
      }));
    }

    post.comments = comments.map((comment) => ({
      ...comment,
      user: {
        id: comment.author_id,
        username: comment.username,
        avatar: comment.avatar,
      },
      isLiked: Boolean(comment.is_liked),
      likes: comment.likes_count,
      images: (() => {
        if (!comment.images) return [];
        try {
          if (Array.isArray(comment.images)) {
            return comment.images;
          } else if (typeof comment.images === 'string') {
            return JSON.parse(comment.images);
          }
          return [];
        } catch (error) {
          console.error('解析评论图片数据失败:', error);
          return [];
        }
      })(),
    }));

    // 更新浏览量
    await db.execute("UPDATE posts SET views = views + 1 WHERE id = ?", [
      post.id,
    ]);

    res.json(post);
  } catch (error) {
    console.error("获取帖子详情失败:", error);
    res.status(500).json({ message: "获取帖子详情失败" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, content, images = [], tags = [], category_id, audio } = req.body;
    if (!content && (!images || images.length === 0)) {
      return res.status(400).json({ message: "内容和图片不能同时为空" });
    }
    
    // 验证标题长度
    if (title && title.length > 10) {
      return res.status(400).json({ message: "标题不能超过10个字符" });
    }

    const userId = req.user.id;
    
    // 验证分类ID是否存在
    if (category_id) {
      const [categories] = await db.execute(
        "SELECT id FROM categories WHERE id = ?", 
        [category_id]
      );
      
      if (categories.length === 0) {
        return res.status(400).json({ message: "选择的分类不存在" });
      }
    }

    // 确保所有参数都有值
    const params = [
      userId,
      title.trim(),
      content.trim(),
      JSON.stringify(images || []), // 确保不会是 undefined
      audio || null, // 添加音频字段
      category_id || null, // 添加分类ID字段
    ];

    // 检查参数是否包含 undefined
    if (params.some((param) => param === undefined)) {
      return res.status(400).json({ message: "参数错误" });
    }

    const [result] = await db.execute(
      "INSERT INTO posts (user_id, title, content, images, audio, category_id, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      params
    );

    // 帖子创建成功后，更新任务进度
    try {
      // 查询用户今日任务记录
      const today = new Date().toISOString().split('T')[0];
      const [taskRecords] = await db.execute(
        `SELECT * FROM user_tasks 
         WHERE user_id = ? AND task_type = 'post' AND date = ?`,
        [userId, today]
      );
      
      if (taskRecords.length > 0) {
        const task = taskRecords[0];
        const newProgress = task.progress + 1;
        
        // 更新任务进度
        await db.execute(
          `UPDATE user_tasks 
           SET progress = ? 
           WHERE id = ?`,
          [newProgress, task.id]
        );
        
        // 查询任务定义获取目标和奖励值
        const [taskDefinitions] = await db.execute(
          `SELECT * FROM tasks WHERE task_type = 'post'`
        );
        
        if (taskDefinitions.length > 0) {
          const taskDef = taskDefinitions[0];
          
          // 检查任务是否完成
          if (task.progress < taskDef.target && newProgress >= taskDef.target) {
            // 任务刚完成，添加经验值（考虑每日上限）
            const earnedExp = await taskController.addUserExperience(
              userId, 
              taskDef.reward, 
              `完成任务: ${taskDef.title}`
            );
            
            if (earnedExp > 0) {
              // 更新任务完成时间
              await db.execute(
                `UPDATE user_tasks SET completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [task.id]
              );
            }
          }
        }
      }
      
      // 每次发帖都单独奖励10点经验（与任务奖励独立）
      await taskController.addUserExperience(
        userId, 
        10, 
        '发布帖子'
      );
    } catch (taskError) {
      console.error('更新任务进度失败:', taskError);
      // 不影响主流程，继续返回创建帖子成功
    }

    res.status(201).json({
      id: result.insertId,
      message: "发布成功",
    });
  } catch (error) {
    console.error("发布帖子失败:", error);
    res.status(500).json({ message: "发布失败" });
  }
};

exports.createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, audio, images: imageUrls } = req.body;
    const postId = req.params.postId;
    const userId = req.user.id;

    // 确保评论至少有文字内容、音频内容或图片
    if (!content && !audio && (!imageUrls || imageUrls.length === 0)) {
      return res.status(400).json({ message: "评论必须包含文字、音频或图片内容" });
    }

    // 获取帖子作者ID
    const [postResult] = await db.execute(
      "SELECT user_id, title FROM posts WHERE id = ?",
      [postId]
    );

    if (!postResult.length) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 处理图片数组为JSON
    const imagesJson = imageUrls && imageUrls.length ? JSON.stringify(imageUrls) : null;

    // 先创建评论
    const [result] = await db.execute(
      "INSERT INTO comments (post_id, user_id, content, audio, images, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      [postId, userId, content || '', audio || null, imagesJson]
    );
    
    const commentId = result.insertId;

    // 如果不是评论自己的帖子，才发送通知
    if (postResult[0].user_id !== userId) {
      // 创建评论通知，添加评论ID作为relatedId
      await createNotification({
        userId: postResult[0].user_id,
        type: "comment",
        content: `评论了你的帖子: ${postResult[0].title || ''}`,
        sourceId: postId || null,
        sourceType: "post",
        actorId: userId || null,
        relatedId: commentId || null
      });
    }
    
    // 评论创建成功后，更新任务进度
    try {
      console.log('开始处理评论经验奖励，用户ID:', userId);
      
      // 查询用户今日任务记录
      const today = new Date().toISOString().split('T')[0];
      const [taskRecords] = await db.execute(
        `SELECT * FROM user_tasks 
         WHERE user_id = ? AND task_type = 'comment' AND date = ?`,
        [userId, today]
      );
      
      console.log('任务记录查询结果:', JSON.stringify(taskRecords));
      
      if (taskRecords.length > 0) {
        const task = taskRecords[0];
        const newProgress = task.progress + 1;
        
        console.log('当前任务进度:', task.progress, '新进度:', newProgress);
        
        // 更新任务进度
        await db.execute(
          `UPDATE user_tasks 
           SET progress = ? 
           WHERE id = ?`,
          [newProgress, task.id]
        );
        
        // 查询任务定义获取目标和奖励值
        const [taskDefinitions] = await db.execute(
          `SELECT * FROM tasks WHERE task_type = 'comment'`
        );
        
        console.log('任务定义:', JSON.stringify(taskDefinitions));
        
        if (taskDefinitions.length > 0) {
          const taskDef = taskDefinitions[0];
          
          // 检查任务是否完成
          if (task.progress < taskDef.target && newProgress >= taskDef.target) {
            console.log('任务达成条件满足，准备奖励经验');
            
            // 任务刚完成，添加经验值（考虑每日上限）
            const earnedExp = await taskController.addUserExperience(
              userId, 
              taskDef.reward, 
              `完成任务: ${taskDef.title}`
            );
            
            console.log('任务完成奖励经验:', earnedExp);
            
            if (earnedExp > 0) {
              // 更新任务完成时间
              await db.execute(
                `UPDATE user_tasks SET completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [task.id]
              );
            }
          }
        }
      }
      
      // 每次评论都单独奖励5点经验（与任务奖励独立）
      console.log('开始奖励评论基础经验(5点)');
      const gainedExp = await taskController.addUserExperience(
        userId, 
        5, 
        '发表评论'
      );
      console.log('评论获得基础经验:', gainedExp);
      
    } catch (taskError) {
      console.error('更新任务进度失败:', taskError);
      // 不影响主流程，继续返回创建评论成功
    }

    // 获取评论详情
    const [comments] = await db.execute(
      `SELECT 
        c.id, c.post_id, c.user_id, c.content, c.created_at, c.audio, c.images,
        u.username, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`,
      [commentId]
    );

    if (!comments.length) {
      return res.status(201).json({ message: "评论成功，但获取评论详情失败" });
    }

    const comment = comments[0];
    
    // 解析JSON图片数据，添加错误处理
    let images = [];
    if (comment.images) {
      try {
        // 检查是否已经是数组
        if (Array.isArray(comment.images)) {
          images = comment.images;
        } else if (typeof comment.images === 'string') {
          // 尝试解析JSON字符串
          images = JSON.parse(comment.images);
        }
      } catch (error) {
        console.error('解析评论图片数据失败:', error);
        // 解析失败时使用空数组
        images = [];
      }
    }

    res.status(201).json({
      message: "评论成功",
      comment: {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        audio: comment.audio,
        images: images,
        user: {
          id: comment.user_id,
          username: comment.username,
          avatar: comment.avatar
        }
      }
    });
  } catch (error) {
    console.error("发表评论失败:", error);
    res.status(500).json({ message: "发表评论失败" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, category_id } = req.body;
    const userId = req.user.id;

    // 验证标题长度
    if (title && title.length > 10) {
      return res.status(400).json({ message: "标题不能超过10个字符" });
    }

    // 检查帖子是否存在且属于当前用户
    const [posts] = await db.execute(
      "SELECT * FROM posts WHERE id = ? AND user_id = ?",
      [postId, userId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: "帖子不存在或无权限" });
    }

    // 验证分类ID是否存在
    if (category_id) {
      const [categories] = await db.execute(
        "SELECT id FROM categories WHERE id = ?", 
        [category_id]
      );
      
      if (categories.length === 0) {
        return res.status(400).json({ message: "选择的分类不存在" });
      }
    }

    await db.execute(
      "UPDATE posts SET title = ?, content = ?, category_id = ? WHERE id = ?", 
      [title, content, category_id || null, postId]
    );

    res.json({ message: "更新成功" });
  } catch (error) {
    console.error("更新帖子失败:", error);
    res.status(500).json({ message: "更新失败" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // 检查帖子是否存在且属于当前用户
    const [posts] = await db.execute(
      "SELECT * FROM posts WHERE id = ? AND user_id = ?",
      [postId, userId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: "帖子不存在或无权限" });
    }

    await db.execute("DELETE FROM posts WHERE id = ?", [postId]);

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除帖子失败:", error);
    res.status(500).json({ message: "删除失败" });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 获取评论总数
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as total FROM comments WHERE post_id = ?",
      [postId]
    );
    const total = countResult[0].total;

    // 获取评论列表
    const [comments] = await db.execute(
      `SELECT c.*, u.username 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.post_id = ? 
       ORDER BY c.created_at DESC 
       LIMIT ? OFFSET ?`,
      [postId, Number(limit), offset]
    );

    res.json({
      comments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取评论列表错误:", error);
    res.status(500).json({ message: "获取评论列表失败" });
  }
};

// 点赞帖子
exports.likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    // 获取帖子ID，支持使用postId或id参数
    const postId = req.params.postId || req.params.id;
    
    if (!postId) {
      console.error('点赞失败: 缺少帖子ID参数');
      return res.status(400).json({ message: "缺少帖子ID参数" });
    }
    
    console.log(`处理点赞请求: 用户ID=${userId}, 帖子ID=${postId}, 请求方法=${req.method}`);

    // 检查帖子是否存在
    const [posts] = await db.execute("SELECT * FROM posts WHERE id = ?", [postId]);
    if (posts.length === 0) {
      console.error(`点赞失败: 帖子不存在 (ID: ${postId})`);
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 检查用户是否已点赞 - 修改表名为likes
    const [likes] = await db.execute(
      "SELECT * FROM likes WHERE user_id = ? AND post_id = ?",
      [userId, postId]
    );

    // DELETE请求或已点赞状态下的POST请求都视为取消点赞
    const shouldUnlike = req.method === 'DELETE' || likes.length > 0;

    if (shouldUnlike) {
      // 取消点赞
      if (likes.length > 0) {
        // 修改表名为likes
        await db.execute(
          "DELETE FROM likes WHERE user_id = ? AND post_id = ?",
          [userId, postId]
        );
        
        // 更新帖子的点赞计数（减少）
        await db.execute(
          "UPDATE posts SET likes = likes - 1 WHERE id = ?",
          [postId]
        );
        
        console.log(`用户${userId}成功取消点赞帖子${postId}`);
      } else {
        console.log(`用户${userId}尝试取消点赞未点赞的帖子${postId}`);
      }

      return res.json({ message: "取消点赞成功", action: "unlike" });
    } else {
      // 添加点赞 - 修改表名为likes
      await db.execute(
        "INSERT INTO likes (user_id, post_id) VALUES (?, ?)",
        [userId, postId]
      );
      
      // 更新帖子的点赞计数（增加）
      await db.execute(
        "UPDATE posts SET likes = likes + 1 WHERE id = ?",
        [postId]
      );
      
      console.log(`用户${userId}成功点赞帖子${postId}`);
      
      // 默认经验值获取状态为未达到限制
      let reachedLikeLimit = false;

      // 点赞成功后，更新任务进度
      try {
        // 查询用户今日任务记录
        const today = new Date().toISOString().split('T')[0];
        const [taskRecords] = await db.execute(
          `SELECT * FROM user_tasks 
           WHERE user_id = ? AND task_type = 'like' AND date = ?`,
          [userId, today]
        );
        
        if (taskRecords.length > 0) {
          const task = taskRecords[0];
          const newProgress = task.progress + 1;
          
          console.log(`更新点赞任务进度: 用户${userId}, 当前进度${task.progress}->新进度${newProgress}`);
          
          // 更新任务进度
          await db.execute(
            `UPDATE user_tasks 
             SET progress = ? 
             WHERE id = ?`,
            [newProgress, task.id]
          );
          
          // 查询任务定义获取目标和奖励值
          const [taskDefinitions] = await db.execute(
            `SELECT * FROM tasks WHERE task_type = 'like'`
          );
          
          if (taskDefinitions.length > 0) {
            const taskDef = taskDefinitions[0];
            
            // 检查任务是否完成
            if (task.progress < taskDef.target && newProgress >= taskDef.target) {
              console.log(`用户${userId}完成点赞任务，准备奖励经验`);
              
              // 任务刚完成，添加经验值（考虑每日上限）
              const earnedExp = await taskController.addUserExperience(
                userId, 
                taskDef.reward, 
                `完成任务: ${taskDef.title}`
              );
              
              console.log(`用户${userId}完成点赞任务获得${earnedExp}点经验`);
              
              if (earnedExp > 0) {
                // 更新任务完成时间
                await db.execute(
                  `UPDATE user_tasks SET completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
                  [task.id]
                );
              }
            }
          }
        } else {
          console.log(`用户${userId}今日无点赞任务记录`);
        }
        
        // 检查用户今日获得经验的点赞次数（最多5次）
        const [likeExpCount] = await db.execute(
          `SELECT COUNT(*) as count FROM user_exp_history 
           WHERE user_id = ? AND DATE(created_at) = ? AND source = '点赞帖子'`,
          [userId, today]
        );
        
        const dailyLikeCount = likeExpCount[0]?.count || 0;
        console.log(`用户${userId}今日已获得经验的点赞次数: ${dailyLikeCount}`);
        
        // 每次点赞都单独奖励2点经验（与任务奖励独立），但每天最多获得5次
        if (dailyLikeCount < 5) {
          console.log(`为用户${userId}添加点赞基础经验(2点)`);
          const gainedExp = await taskController.addUserExperience(
            userId, 
            2, 
            '点赞帖子'
          );
          console.log(`用户${userId}点赞获得${gainedExp}点基础经验`);
        } else {
          console.log(`用户${userId}今日点赞获得经验次数已达上限(5次)`);
          reachedLikeLimit = true;
        }
        
      } catch (taskError) {
        console.error('更新任务进度失败:', taskError);
        // 不影响主流程，继续返回点赞成功
      }

      res.json({ 
        message: "点赞成功", 
        action: "like",
        reachedLikeLimit: reachedLikeLimit
      });
    }
  } catch (error) {
    console.error("点赞操作失败:", error);
    res.status(500).json({ message: "点赞失败，请稍后重试" });
  }
};

// 获取我的帖子
exports.getMyPosts = async (req, res) => {
  try {
    const [posts] = await db.query(
      `SELECT 
        p.id,
        p.user_id,
        p.title,
        p.content,
        p.views,
        p.likes,
        p.created_at,
        p.images,
        u.username,
        CASE 
          WHEN u.avatar IS NOT NULL AND u.avatar != '' 
          THEN CONCAT('http://localhost:3000/uploads/avatars/', u.avatar)
          ELSE NULL 
        END as avatar,
        u.id as author_id,
        COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id), 0) as comments_count,
        COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id), 0) as likes_count,
        IF(EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?), 1, 0) as is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC`,
      [req.user.id, req.user.id]
    );

    // 处理每个帖子的图片数据
    const processedPosts = posts.map((post) => {
      let parsedImages = [];
      try {
        if (post.images && typeof post.images === "string") {
          parsedImages = JSON.parse(post.images);
        } else if (Array.isArray(post.images)) {
          parsedImages = post.images;
        }
      } catch (error) {
        console.error("解析图片数据失败:", error);
        parsedImages = [];
      }

      return {
        ...post,
        user: {
          id: post.author_id,
          username: post.username || "匿名用户",
          avatar: post.avatar || null,
        },
        images: parsedImages,
        is_liked: Boolean(post.is_liked),
      };
    });

    res.json({
      posts: processedPosts,
    });
  } catch (error) {
    console.error("获取我的帖子失败:", error);
    res.status(500).json({ message: "获取我的帖子失败" });
  }
};

// 获取我点赞的帖子
exports.getMyLikedPosts = async (req, res) => {
  try {
    const [posts] = await db.query(
      `SELECT 
        p.id,
        p.user_id,
        p.title,
        p.content,
        p.views,
        p.likes,
        p.created_at,
        p.images,
        u.username,
        CASE 
          WHEN u.avatar IS NOT NULL AND u.avatar != '' 
          THEN CONCAT('http://localhost:3000/uploads/avatars/', u.avatar)
          ELSE NULL 
        END as avatar,
        u.id as author_id,
        COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id), 0) as comments_count,
        COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id), 0) as likes_count,
        1 as is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      INNER JOIN likes l ON p.id = l.post_id
      WHERE l.user_id = ?
      ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    // 处理每个帖子的图片数据
    const processedPosts = posts.map((post) => {
      let parsedImages = [];
      try {
        if (post.images && typeof post.images === "string") {
          parsedImages = JSON.parse(post.images);
        } else if (Array.isArray(post.images)) {
          parsedImages = post.images;
        }
      } catch (error) {
        console.error("解析图片数据失败:", error);
        parsedImages = [];
      }

      return {
        ...post,
        user: {
          id: post.author_id,
          username: post.username || "匿名用户",
          avatar: post.avatar || null,
        },
        images: parsedImages,
        is_liked: Boolean(post.is_liked),
      };
    });

    res.json({
      posts: processedPosts,
    });
  } catch (error) {
    console.error("获取点赞帖子失败:", error);
    res.status(500).json({ message: "获取点赞帖子失败" });
  }
};

// 上传图片
exports.uploadImage = async (req, res) => {
  try {
    console.log("开始处理图片上传...");
    
    upload(req, res, async (err) => {
      if (err) {
        console.error("上传过程中发生错误:", err);
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        console.error("未找到上传的文件");
        return res.status(400).json({ message: "请选择要上传的图片" });
      }

      console.log("文件上传成功:", {
        文件名: req.file.filename,
        原始文件名: req.file.originalname,
        文件类型: req.file.mimetype,
        文件大小: req.file.size,
        保存路径: req.file.path
      });

      // 添加CORS头部
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

      // 返回图片URL
      const imageUrl = `/uploads/posts/${req.file.filename}`;
      console.log("返回的图片URL:", imageUrl);
      
      res.json({
        url: imageUrl,
        name: req.file.originalname,
      });
    });
  } catch (error) {
    console.error("上传图片失败:", error);
    res.status(500).json({ message: "上传图片失败" });
  }
};

// 获取用户资料
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user.id;

    // 获取用户基本信息
    const [userResult] = await db.execute(
      `SELECT 
        u.id, u.username, u.avatar, u.bio, u.cover_image,
        (SELECT COUNT(*) FROM follows WHERE followed_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = u.id) as is_following
      FROM users u
      WHERE u.id = ?`,
      [currentUserId, userId]
    );

    if (!userResult.length) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 获取用户的帖子
    const [posts] = await db.execute(
      `SELECT 
        p.*, 
        u.username,
        u.avatar,
        COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id), 0) as comments_count,
        COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id), 0) as likes_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC`,
      [userId]
    );

    // 处理帖子数据
    const processedPosts = posts.map((post) => ({
      ...post,
      images: post.images ? JSON.parse(post.images) : [],
      user: {
        id: post.user_id,
        username: post.username,
        avatar: post.avatar,
      },
    }));

    res.json({
      user: userResult[0],
      posts: processedPosts,
      isFollowing: Boolean(userResult[0].is_following),
    });
  } catch (error) {
    console.error("获取用户资料失败:", error);
    res.status(500).json({ message: "获取用户资料失败" });
  }
};

// 关注用户
exports.followUser = async (req, res) => {
  try {
    const followedId = req.params.userId;
    const followerId = req.user.id;

    if (followedId === followerId) {
      return res.status(400).json({ message: "不能关注自己" });
    }

    // 创建关注通知
    await createNotification({
      userId: followedId,
      type: "follow",
      content: "关注了你",
      sourceId: followerId || null,
      sourceType: "user",
      actorId: followerId || null,
    });

    await db.execute(
      "INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)",
      [followerId, followedId]
    );

    res.json({ message: "关注成功" });
  } catch (error) {
    console.error("关注用户失败:", error);
    res.status(500).json({ message: "关注失败" });
  }
};

// 取消关注
exports.unfollowUser = async (req, res) => {
  try {
    const followedId = req.params.userId;
    const followerId = req.user.id;

    await db.execute(
      "DELETE FROM follows WHERE follower_id = ? AND followed_id = ?",
      [followerId, followedId]
    );

    res.json({ message: "取消关注成功" });
  } catch (error) {
    console.error("取消关注失败:", error);
    res.status(500).json({ message: "取消关注失败" });
  }
};

// 更新评论
exports.updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // 检查评论是否存在且属于当前用户
    const [comments] = await db.execute(
      "SELECT * FROM comments WHERE id = ? AND user_id = ? AND post_id = ?",
      [commentId, userId, postId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ message: "评论不存在或无权限" });
    }

    await db.execute("UPDATE comments SET content = ? WHERE id = ?", [
      content,
      commentId,
    ]);

    res.json({ message: "更新成功" });
  } catch (error) {
    console.error("更新评论失败:", error);
    res.status(500).json({ message: "更新失败" });
  }
};

// 删除评论
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    // 检查评论是否存在且属于当前用户
    const [comments] = await db.execute(
      "SELECT * FROM comments WHERE id = ? AND user_id = ? AND post_id = ?",
      [commentId, userId, postId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ message: "评论不存在或无权限" });
    }

    await db.execute("DELETE FROM comments WHERE id = ?", [commentId]);

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除评论失败:", error);
    res.status(500).json({ message: "删除失败" });
  }
};

// 点赞评论
exports.likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    // 获取评论作者ID和帖子信息
    const [comments] = await db.execute(
      `SELECT c.user_id, c.content, p.title 
       FROM comments c 
       JOIN posts p ON c.post_id = p.id 
       WHERE c.id = ?`,
      [commentId]
    );

    if (!comments.length) {
      return res.status(404).json({ message: "评论不存在" });
    }

    if (comments[0].user_id !== userId) {
      // 创建点赞通知，添加评论ID作为relatedId
      await createNotification({
        userId: comments[0].user_id,
        type: "like",
        content: `赞了你在《${comments[0].title || ''}》中的评论`,
        sourceId: postId || null,
        sourceType: "comment",
        actorId: userId || null,
      });
    }

    // 检查是否已经点赞
    const [existingLike] = await db.execute(
      "SELECT * FROM comment_likes WHERE comment_id = ? AND user_id = ?",
      [commentId, userId]
    );

    if (existingLike.length > 0) {
      return res.status(400).json({ message: "已经点赞过了" });
    }

    // 创建点赞记录
    await db.execute(
      "INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)",
      [commentId, userId]
    );

    res.json({ message: "点赞成功" });
  } catch (error) {
    console.error("点赞评论失败:", error);
    res.status(500).json({ message: "点赞失败" });
  }
};

// 取消点赞评论
exports.unlikeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    // 删除点赞记录
    await db.execute(
      "DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?",
      [commentId, userId]
    );

    res.json({ message: "取消点赞成功" });
  } catch (error) {
    console.error("取消点赞评论失败:", error);
    res.status(500).json({ message: "取消点赞失败" });
  }
};

// 回复评论
exports.replyToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content, replyToId, audio } = req.body;
    const userId = req.user.id;
    
    // 确保回复至少有文字内容或音频内容
    if (!content && !audio) {
      return res.status(400).json({ message: "回复必须包含文字或音频内容" });
    }

    // 获取评论作者ID和帖子信息
    const [commentResult] = await db.execute(
      `SELECT c.user_id, p.title FROM comments c
       JOIN posts p ON c.post_id = p.id
       WHERE c.id = ?`,
      [commentId]
    );

    if (!commentResult.length) {
      return res.status(404).json({ message: "评论不存在" });
    }

    // 如果不是回复自己的评论，才发送通知
    if (commentResult[0].user_id !== userId) {
      await createNotification({
        userId: commentResult[0].user_id,
        type: "reply",
        content: `回复了你在《${commentResult[0].title || ''}》中的评论`,
        sourceId: postId || null,
        sourceType: "comment",
        actorId: userId || null,
      });
    }

    // 如果指定了回复对象，且不是自己，也要通知
    if (replyToId && replyToId !== userId) {
      await createNotification({
        userId: replyToId,
        type: "reply",
        content: `在《${commentResult[0].title || ''}》中提到了你`,
        sourceId: postId || null,
        sourceType: "comment",
        actorId: userId || null,
      });
    }

    // 创建回复
    const [result] = await db.execute(
      "INSERT INTO comment_replies (comment_id, user_id, reply_to_id, content, audio) VALUES (?, ?, ?, ?, ?)",
      [commentId, userId, replyToId || null, content || '', audio || null]
    );

    res.status(201).json({
      message: "回复成功",
      replyId: result.insertId,
    });
  } catch (error) {
    console.error("回复评论失败:", error);
    res.status(500).json({ message: "回复失败" });
  }
};

// 删除回复
exports.deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;

    // 检查回复是否存在且属于当前用户
    const [replies] = await db.execute(
      "SELECT * FROM comment_replies WHERE id = ? AND user_id = ?",
      [replyId, userId]
    );

    if (replies.length === 0) {
      return res.status(404).json({ message: "回复不存在或无权限删除" });
    }

    // 执行删除操作
    await db.execute("DELETE FROM comment_replies WHERE id = ?", [replyId]);

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除回复失败:", error);
    res.status(500).json({ message: "删除失败" });
  }
};

// 创建评论回复
exports.createCommentReply = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId, commentId } = req.params;
    const { content, replyToId, audio } = req.body;
    const userId = req.user.id;
    
    // 确保回复至少有文字内容或音频内容
    if (!content && !audio) {
      return res.status(400).json({ message: "回复必须包含文字或音频内容" });
    }

    // 检查帖子是否存在
    const [postExists] = await db.execute("SELECT title FROM posts WHERE id = ?", [
      postId,
    ]);

    if (postExists.length === 0) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 获取评论信息和帖子标题
    const [commentResult] = await db.execute(
      `SELECT c.*, p.title FROM comments c
       JOIN posts p ON c.post_id = p.id
       WHERE c.id = ? AND c.post_id = ?`,
      [commentId, postId]
    );

    if (!commentResult.length) {
      return res.status(404).json({ message: "评论不存在" });
    }

    // 创建回复
    const [result] = await db.execute(
      "INSERT INTO comment_replies (comment_id, user_id, reply_to_id, content, audio) VALUES (?, ?, ?, ?, ?)",
      [commentId, userId, replyToId || null, content || '', audio || null]
    );
    
    const replyId = result.insertId;

    // 如果不是回复自己的评论，才发送通知
    if (commentResult[0].user_id !== userId) {
      await createNotification({
        userId: commentResult[0].user_id,
        type: "reply",
        content: `回复了你在《${commentResult[0].title || ''}》中的评论`,
        sourceId: postId || null,
        sourceType: "comment",
        actorId: userId || null,
      });
    }

    res.status(201).json({
      message: "回复成功",
      replyId: replyId,
    });
  } catch (error) {
    console.error("回复评论失败:", error);
    res.status(500).json({ message: "回复失败" });
  }
};

// 上传音频文件
exports.uploadAudio = (req, res) => {
  uploadAudio(req, res, (err) => {
    if (err) {
      console.error("音频上传错误:", err);
      return res.status(400).json({
        message: err.message || "音频上传失败",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "请选择要上传的音频文件" });
    }

    // 获取客户端传递的音频持续时间并确保它是数字
    const duration = req.body.duration ? parseInt(req.body.duration) : 0;
    
    // 验证持续时间是否合理
    const validDuration = (duration > 0 && duration < 600) ? duration : 0; // 最长10分钟
    
    console.log("接收到的音频实际持续时间:", validDuration, "秒", "请求体:", req.body);
    
    // 确保持续时间参数被添加到URL（即使为0也添加，便于前端识别）
    const audioUrl = `/uploads/audio/${req.file.filename}?duration=${validDuration}`;
    console.log("生成的音频URL(包含持续时间):", audioUrl);
    
    // 为确保客户端能正确访问音频文件，使用绝对URL
    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('host');
    const fullUrl = `${protocol}://${host}${audioUrl}`;
    console.log("完整的音频URL:", fullUrl);

    // 返回响应，包含持续时间信息
    res.json({
      url: audioUrl,
      fullUrl: fullUrl,
      filename: req.file.filename,
      duration: validDuration,
      message: "音频上传成功",
    });
  });
};

// 获取用户表情包列表
exports.getUserEmojis = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [emojis] = await db.execute(
      "SELECT id, url, name, created_at FROM user_emojis WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    
    res.json({ emojis });
  } catch (error) {
    console.error("获取表情包失败:", error);
    res.status(500).json({ message: "获取表情包失败" });
  }
};

// 添加表情包
exports.addEmoji = async (req, res) => {
  try {
    const { url, name } = req.body;
    const userId = req.user.id;
    
    if (!url) {
      return res.status(400).json({ message: "表情包URL不能为空" });
    }
    
    const [result] = await db.execute(
      "INSERT INTO user_emojis (user_id, url, name) VALUES (?, ?, ?)",
      [userId, url, name || null]
    );
    
    res.status(201).json({
      message: "添加表情包成功",
      emoji: {
        id: result.insertId,
        url,
        name,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error("添加表情包失败:", error);
    res.status(500).json({ message: "添加表情包失败" });
  }
};

// 删除表情包
exports.deleteEmoji = async (req, res) => {
  try {
    const emojiId = req.params.emojiId;
    const userId = req.user.id;
    
    // 检查是否是用户自己的表情包
    const [emojis] = await db.execute(
      "SELECT * FROM user_emojis WHERE id = ? AND user_id = ?",
      [emojiId, userId]
    );
    
    if (emojis.length === 0) {
      return res.status(404).json({ message: "表情包不存在或无权限删除" });
    }
    
    await db.execute(
      "DELETE FROM user_emojis WHERE id = ?",
      [emojiId]
    );
    
    res.json({ message: "删除表情包成功" });
  } catch (error) {
    console.error("删除表情包失败:", error);
    res.status(500).json({ message: "删除表情包失败" });
  }
};

// 举报帖子
exports.reportPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason) {
      return res.status(400).json({ message: "举报原因不能为空" });
    }

    // 检查帖子是否存在
    const [posts] = await db.execute(
      "SELECT id FROM posts WHERE id = ?",
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 检查是否已举报过
    const [existingReports] = await db.execute(
      "SELECT id FROM reports WHERE reporter_id = ? AND reported_type = 'post' AND reported_id = ?",
      [userId, postId]
    );

    if (existingReports.length > 0) {
      return res.status(400).json({ message: "您已经举报过该帖子" });
    }

    // 创建举报记录
    await db.execute(
      "INSERT INTO reports (reporter_id, reported_type, reported_id, reason) VALUES (?, 'post', ?, ?)",
      [userId, postId, reason]
    );

    return res.status(200).json({ 
      success: true,
      message: "举报成功，我们会尽快处理" 
    });
  } catch (error) {
    console.error("举报帖子失败:", error);
    return res.status(500).json({ message: "举报失败，请稍后再试" });
  }
};

// 举报评论
exports.reportComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason) {
      return res.status(400).json({ message: "举报原因不能为空" });
    }

    // 检查评论是否存在
    const [comments] = await db.execute(
      "SELECT id FROM comments WHERE id = ?",
      [commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ message: "评论不存在" });
    }

    // 检查是否已举报过
    const [existingReports] = await db.execute(
      "SELECT id FROM reports WHERE reporter_id = ? AND reported_type = 'comment' AND reported_id = ?",
      [userId, commentId]
    );

    if (existingReports.length > 0) {
      return res.status(400).json({ message: "您已经举报过该评论" });
    }

    // 创建举报记录
    await db.execute(
      "INSERT INTO reports (reporter_id, reported_type, reported_id, reason) VALUES (?, 'comment', ?, ?)",
      [userId, commentId, reason]
    );

    return res.status(200).json({ 
      success: true,
      message: "举报成功，我们会尽快处理" 
    });
  } catch (error) {
    console.error("举报评论失败:", error);
    return res.status(500).json({ message: "举报失败，请稍后再试" });
  }
};
