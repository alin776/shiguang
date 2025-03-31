const RatePost = require('../models/ratePost');
const { handleUpload } = require('../utils/fileUpload');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

// 获取评分贴列表
exports.getRatePosts = async (req, res) => {
  try {
    const category = req.query.category || 'all';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await RatePost.getAll(category, page, limit);
    
    res.json({
      success: true,
      data: result.ratePosts,
      total: result.total,
      hasMore: result.hasMore
    });
  } catch (error) {
    console.error('获取评分贴列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取评分贴列表失败'
    });
  }
};

// 获取评分贴详情
exports.getRatePostDetail = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    console.log(`获取评分贴详情: 帖子ID=${postId}, 用户ID=${userId}`);
    
    const post = await RatePost.getById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '评分贴不存在'
      });
    }
    
    // 获取用户对该评分贴的评分记录
    const userRatings = await RatePost.getUserRatings(userId, postId);
    
    // 获取用户对评论的点赞记录
    const commentIds = [];
    post.options.forEach(option => {
      if (option.comments) {
        option.comments.forEach(comment => {
          commentIds.push(comment.id);
        });
      }
    });
    
    const userLikes = await RatePost.checkLiked(userId, commentIds);
    
    // 添加点赞信息到评论
    post.options.forEach(option => {
      if (option.comments) {
        option.comments.forEach(comment => {
          comment.isLiked = !!userLikes[comment.id];
        });
      }
      
      // 检查评分分布数据并记录日志
      if (option.ratingDistribution) {
        console.log(`选项 ${option.name} 的评分分布:`, option.ratingDistribution);
      } else {
        console.log(`警告: 选项 ${option.name} 缺少评分分布数据`);
      }
      
      // 检查评分详情数据
      if (option.ratingsDetail && option.ratingsDetail.length > 0) {
        console.log(`选项 ${option.name} 有 ${option.ratingsDetail.length} 条评分记录`);
      }
    });
    
    res.json({
      success: true,
      data: {
        post,
        userRatings
      }
    });
  } catch (error) {
    console.error('获取评分贴详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取评分贴详情失败'
    });
  }
};

// 创建评分贴
exports.createRatePost = async (req, res) => {
  try {
    const { title, description, category, options } = req.body;
    const userId = req.user.id;
    
    // 验证必填字段
    if (!title || !category || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: '标题、分类和评分选项（至少2个）为必填项'
      });
    }
    
    // 处理选项图片上传
    const processedOptions = [];
    for (const option of options) {
      if (!option.name) {
        return res.status(400).json({
          success: false,
          message: '所有选项必须有名称'
        });
      }
      
      // 如果传递了base64图片，则处理图片
      let avatarPath = null;
      if (option.avatar && option.avatar.startsWith('data:image')) {
        const uploadDir = path.join(__dirname, '../uploads/rate_options');
        
        // 确保上传目录存在
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // 上传图片
        const filename = `option_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const avatarUrl = await handleUpload(option.avatar, uploadDir, filename);
        
        // 返回相对路径
        avatarPath = `/uploads/rate_options/${path.basename(avatarUrl)}`;
      } else if (option.avatar) {
        // 如果是已有图片路径，直接使用
        avatarPath = option.avatar;
      }
      
      processedOptions.push({
        name: option.name,
        avatar: avatarPath
      });
    }
    
    // 创建评分贴
    const result = await RatePost.create(userId, { 
      title, 
      description, 
      category, 
      options: processedOptions 
    });
    
    res.json({
      success: true,
      data: {
        id: result.id,
        message: '评分贴创建成功'
      }
    });
  } catch (error) {
    console.error('创建评分贴错误:', error);
    res.status(500).json({
      success: false,
      message: '创建评分贴失败'
    });
  }
};

// 添加评分
exports.addRating = async (req, res) => {
  try {
    const { optionId, score } = req.body;
    const userId = req.user.id;
    
    // 验证参数
    if (!optionId || !score || score < 1 || score > 10) {
      return res.status(400).json({
        success: false,
        message: '选项ID和评分值（1-10）为必填项'
      });
    }
    
    // 添加评分
    const result = await RatePost.addRating(userId, optionId, score);
    
    res.json({
      success: true,
      data: {
        id: result.id,
        message: '评分成功'
      }
    });
  } catch (error) {
    console.error('添加评分错误:', error);
    res.status(500).json({
      success: false,
      message: '添加评分失败'
    });
  }
};

// 添加评论
exports.addComment = async (req, res) => {
  try {
    const { optionId, content } = req.body;
    const userId = req.user.id;
    
    // 验证参数
    if (!optionId || !content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '选项ID和评论内容为必填项'
      });
    }
    
    // 添加评论
    const comment = await RatePost.addComment(userId, optionId, content);
    
    res.json({
      success: true,
      data: {
        comment,
        message: '评论成功'
      }
    });
  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({
      success: false,
      message: '添加评论失败'
    });
  }
};

// 点赞评论
exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    // 验证参数
    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: '评论ID为必填项'
      });
    }
    
    // 点赞/取消点赞评论
    const result = await RatePost.likeComment(userId, commentId);
    
    res.json({
      success: true,
      data: {
        liked: result.liked,
        likes: result.likes,
        message: result.liked ? '点赞成功' : '取消点赞成功'
      }
    });
  } catch (error) {
    console.error('点赞评论错误:', error);
    res.status(500).json({
      success: false,
      message: '点赞评论失败'
    });
  }
};

// 获取选项评分详情
exports.getOptionRatings = async (req, res) => {
  try {
    const optionId = req.params.optionId;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: '选项ID为必填项'
      });
    }
    
    // 查询该选项是否存在
    const [options] = await db.query(
      `SELECT * FROM rate_options WHERE id = ?`,
      [optionId]
    );
    
    if (options.length === 0) {
      return res.status(404).json({
        success: false,
        message: '选项不存在'
      });
    }
    
    // 获取评分详情，带分页
    const offset = (page - 1) * limit;
    const [ratings] = await db.query(
      `SELECT rr.id, rr.user_id, u.username, rr.score, rr.created_at
       FROM rate_ratings rr
       LEFT JOIN users u ON rr.user_id = u.id
       WHERE rr.option_id = ?
       ORDER BY rr.created_at DESC
       LIMIT ? OFFSET ?`,
      [optionId, limit, offset]
    );
    
    // 获取总评分数用于分页
    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM rate_ratings WHERE option_id = ?`,
      [optionId]
    );
    
    const total = countResult[0].total;
    const hasMore = offset + limit < total;
    
    // 获取评分分布
    const distribution = await RatePost.getRatingDistribution(optionId);
    
    res.json({
      success: true,
      data: {
        ratings,
        distribution,
        page,
        limit,
        total,
        hasMore
      }
    });
  } catch (error) {
    console.error('获取评分详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取评分详情失败'
    });
  }
};

// 检查用户是否已评分
exports.checkRatedStatus = async (req, res) => {
  try {
    const optionId = req.params.optionId;
    const userId = req.user.id;
    
    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: '选项ID为必填项'
      });
    }
    
    // 查询该选项是否存在
    const [options] = await db.query(
      `SELECT * FROM rate_options WHERE id = ?`,
      [optionId]
    );
    
    if (options.length === 0) {
      return res.status(404).json({
        success: false,
        message: '选项不存在'
      });
    }
    
    // 检查用户是否已对该选项评分
    const hasRated = await RatePost.hasUserRatedOption(userId, optionId);
    
    res.json({
      success: true,
      data: {
        hasRated
      }
    });
  } catch (error) {
    console.error('检查评分状态错误:', error);
    res.status(500).json({
      success: false,
      message: '检查评分状态失败'
    });
  }
}; 