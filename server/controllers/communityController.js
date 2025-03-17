const { validationResult } = require("express-validator");
const db = require("../config/database");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { createNotification } = require("../controllers/notificationController");

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
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传图片文件"));
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
        COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id), 0) as comments_count,
        COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id), 0) as likes_count,
        IF(EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?), 1, 0) as is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
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
      WHERE 1=1
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
      WHERE p.id = ?`,
      [currentUserId, currentUserId, postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: "帖子不存在" });
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
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC`,
      [currentUserId, postId]
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
    // 验证必要字段
    if (!req.body.title || !req.body.content) {
      return res.status(400).json({ message: "标题和内容不能为空" });
    }

    const { title, content, images, audio, category_id } = req.body;
    let parsedImages = [];

    try {
      if (images) {
        parsedImages = JSON.parse(images);
      }
    } catch (error) {
      console.error("解析图片数据失败:", error);
      // 如果解析失败，设置为空数组而不是 undefined
      parsedImages = [];
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

    // 确保所有参数都有值
    const params = [
      req.user.id,
      title.trim(),
      content.trim(),
      JSON.stringify(parsedImages || []), // 确保不会是 undefined
      audio || null, // 添加音频字段
      category_id || null, // 添加分类ID字段
    ];

    // 检查参数是否包含 undefined
    if (params.some((param) => param === undefined)) {
      return res.status(400).json({ message: "参数错误" });
    }

    const [result] = await db.execute(
      "INSERT INTO posts (user_id, title, content, images, audio, category_id) VALUES (?, ?, ?, ?, ?, ?)",
      params
    );

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

    const { postId } = req.params;
    const { content, audio } = req.body;
    const userId = req.user.id;

    // 确保评论至少有文字内容或音频内容
    if (!content && !audio) {
      return res.status(400).json({ message: "评论必须包含文字或音频内容" });
    }

    // 获取帖子作者ID
    const [postResult] = await db.execute(
      "SELECT user_id, title FROM posts WHERE id = ?",
      [postId]
    );

    if (!postResult.length) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 先创建评论
    const [result] = await db.execute(
      "INSERT INTO comments (post_id, user_id, content, audio) VALUES (?, ?, ?, ?)",
      [postId, userId, content || '', audio || null]
    );
    
    const commentId = result.insertId;

    // 如果不是评论自己的帖子，才发送通知
    if (postResult[0].user_id !== userId) {
      // 创建评论通知，添加评论ID作为relatedId
      await createNotification({
        userId: postResult[0].user_id,
        type: "comment",
        content: `评论了你的帖子"${postResult[0].title}"`,
        sourceId: postId,
        sourceType: "post",
        actorId: userId,
        relatedId: commentId
      });
    }

    res.status(201).json({
      message: "评论创建成功",
      commentId: commentId,
    });
  } catch (error) {
    console.error("创建评论错误:", error);
    res.status(500).json({ message: "创建评论失败" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, category_id } = req.body;
    const userId = req.user.id;

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
    const { postId } = req.params;
    const userId = req.user.id;

    // 获取帖子作者ID
    const [posts] = await db.execute(
      "SELECT user_id, title FROM posts WHERE id = ?",
      [postId]
    );

    if (!posts.length) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 检查是否已经点赞
    const [existingLike] = await db.execute(
      "SELECT * FROM likes WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );

    if (existingLike.length > 0) {
      // 如果已经点赞，则取消点赞
      await db.execute("DELETE FROM likes WHERE post_id = ? AND user_id = ?", [
        postId,
        userId,
      ]);
      await db.execute("UPDATE posts SET likes = likes - 1 WHERE id = ?", [
        postId,
      ]);
      return res.json({ message: "取消点赞成功", action: "unlike" });
    }

    // 如果没有点赞，则添加点赞
    await db.execute("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [
      postId,
      userId,
    ]);
    await db.execute("UPDATE posts SET likes = likes + 1 WHERE id = ?", [
      postId,
    ]);

    // 如果不是给自己的帖子点赞，才发送通知
    if (posts[0].user_id !== userId) {
      await createNotification({
        userId: posts[0].user_id,
        type: "like",
        content: `赞了你的帖子"${posts[0].title}"`,
        sourceId: postId,
        sourceType: "post",
        actorId: userId,
      });
    }

    res.json({ message: "点赞成功", action: "like" });
  } catch (error) {
    console.error("点赞帖子失败:", error);
    res.status(500).json({ message: "点赞失败" });
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
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "请选择要上传的图片" });
      }

      // 添加CORS头部
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

      // 返回图片URL
      res.json({
        url: `/uploads/posts/${req.file.filename}`,
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
      sourceId: followerId,
      sourceType: "user",
      actorId: followerId,
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
        content: `赞了你在《${comments[0].title}》中的评论`,
        sourceId: postId,
        sourceType: "comment",
        actorId: userId,
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
        content: `回复了你在《${commentResult[0].title}》中的评论`,
        sourceId: postId,
        sourceType: "comment",
        actorId: userId,
      });
    }

    // 如果指定了回复对象，且不是自己，也要通知
    if (replyToId && replyToId !== userId) {
      await createNotification({
        userId: replyToId,
        type: "reply",
        content: `在《${commentResult[0].title}》中提到了你`,
        sourceId: postId,
        sourceType: "comment",
        actorId: userId,
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
        content: `回复了你在《${commentResult[0].title}》中的评论`,
        sourceId: postId,
        sourceType: "comment",
        actorId: userId,
        relatedId: replyId
      });
    }

    // 如果指定了回复对象，且不是自己，也要通知
    if (replyToId && replyToId !== userId && replyToId !== commentResult[0].user_id) {
      await createNotification({
        userId: replyToId,
        type: "reply",
        content: `在《${commentResult[0].title}》中提到了你`,
        sourceId: postId,
        sourceType: "comment",
        actorId: userId,
        relatedId: replyId
      });
    }

    res.status(201).json({
      message: "回复成功",
      replyId: replyId,
    });
  } catch (error) {
    console.error("创建评论回复失败:", error);
    res.status(500).json({ message: "创建回复失败" });
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

// ... 其他控制器方法
