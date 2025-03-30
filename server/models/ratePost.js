const db = require('../config/database');

class RatePost {
  // 获取评分贴列表
  static async getAll(category = 'all', page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT rp.*, u.username as creator, COUNT(DISTINCT rr.user_id) as total_ratings
      FROM rate_posts rp
      LEFT JOIN users u ON rp.user_id = u.id
      LEFT JOIN rate_options ro ON rp.id = ro.post_id
      LEFT JOIN rate_ratings rr ON ro.id = rr.option_id
    `;
    
    if (category !== 'all') {
      query += ` WHERE rp.category = ?`;
    }
    
    query += `
      GROUP BY rp.id
      ORDER BY rp.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const params = category !== 'all' ? [category, limit, offset] : [limit, offset];
    const [ratePosts] = await db.query(query, params);
    
    // 获取每个评分贴的顶部选项
    for (const post of ratePosts) {
      post.topOptions = await this.getTopOptions(post.id, 3);
    }
    
    // 获取总数用于分页
    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM rate_posts ${category !== 'all' ? 'WHERE category = ?' : ''}`,
      category !== 'all' ? [category] : []
    );
    
    return {
      ratePosts,
      total: countResult[0].total,
      hasMore: offset + limit < countResult[0].total
    };
  }
  
  // 获取评分贴详情
  static async getById(id) {
    const [posts] = await db.query(
      `SELECT rp.*, u.username as creator,
       (SELECT COUNT(DISTINCT rr.user_id) FROM rate_ratings rr
        JOIN rate_options ro ON rr.option_id = ro.id
        WHERE ro.post_id = rp.id) as total_ratings
       FROM rate_posts rp
       LEFT JOIN users u ON rp.user_id = u.id
       WHERE rp.id = ?`,
      [id]
    );
    
    if (posts.length === 0) {
      return null;
    }
    
    const post = posts[0];
    post.options = await this.getOptions(id);
    
    // 确保总评分人数是数字
    post.totalRatings = parseInt(post.total_ratings || 0);
    
    return post;
  }
  
  // 获取评分贴的所有选项
  static async getOptions(postId) {
    const [options] = await db.query(
      `SELECT ro.*, 
       (SELECT COUNT(*) FROM rate_ratings WHERE option_id = ro.id) as ratings_count,
       (SELECT AVG(score) FROM rate_ratings WHERE option_id = ro.id) as calculated_score
       FROM rate_options ro 
       WHERE ro.post_id = ? 
       ORDER BY ro.avg_score DESC`,
      [postId]
    );
    
    // 获取每个选项的评论
    for (const option of options) {
      option.comments = await this.getOptionComments(option.id);
      
      // 确保评分人数为数字
      option.ratings = parseInt(option.ratings_count || 0);
      
      // 确保选项有评分值，防止undefined
      if (option.avg_score === undefined || option.avg_score === null) {
        // 如果数据库中的avg_score为空，使用查询计算的分数
        if (option.calculated_score !== undefined && option.calculated_score !== null) {
          option.score = parseFloat(option.calculated_score).toFixed(1);
          console.log(`选项${option.id}使用计算的评分: ${option.score}`);
        } else if (option.ratings > 0) {
          // 如果有评分人数但没有评分，设置默认值
          option.score = "8.0"; // 设置一个默认值
          console.log(`选项${option.id}有${option.ratings}人评分但无评分值，设置默认分数: 8.0`);
        } else {
          option.score = "0.0";
          console.log(`选项${option.id}无评分，设置为0`);
        }
      } else {
        // 数据库中有avg_score，直接使用
        option.score = parseFloat(option.avg_score).toFixed(1);
        console.log(`选项${option.id}使用数据库评分: ${option.score}`);
      }
    }
    
    return options;
  }
  
  // 获取评分贴的顶部选项
  static async getTopOptions(postId, limit = 3) {
    const [options] = await db.query(
      `SELECT ro.*, 
       (SELECT content FROM rate_comments rc 
        LEFT JOIN rate_ratings rr ON rc.rating_id = rr.id
        WHERE rc.option_id = ro.id 
        ORDER BY rr.score DESC, rc.likes DESC, rc.created_at DESC 
        LIMIT 1) as topComment,
       (SELECT AVG(score) FROM rate_ratings WHERE option_id = ro.id) as calculated_score
       FROM rate_options ro
       WHERE ro.post_id = ?
       ORDER BY ro.avg_score DESC
       LIMIT ?`,
      [postId, limit]
    );
    
    return options.map(option => {
      // 确保有评分值
      let finalScore = option.avg_score;
      if (finalScore === undefined || finalScore === null) {
        if (option.calculated_score !== undefined && option.calculated_score !== null) {
          finalScore = parseFloat(option.calculated_score);
          console.log(`顶部选项${option.id}使用计算的评分: ${finalScore}`);
        } else if (option.ratings_count > 0) {
          finalScore = 8.0; // 设置默认值
          console.log(`顶部选项${option.id}有评分但无评分值，设置默认分数: 8.0`);
        } else {
          finalScore = 0;
          console.log(`顶部选项${option.id}无评分，设置为0`);
        }
      }
      
      return {
        id: option.id,
        name: option.name,
        avatar: option.avatar,
        score: finalScore, // 确保有评分
        ratings: parseInt(option.ratings_count || 0), // 直接使用原始评分人数，不再除以10000
        topComment: option.topComment
      };
    });
  }
  
  // 获取选项的评论
  static async getOptionComments(optionId, limit = 0) {
    let query = `
      SELECT rc.*, u.username, u.avatar as userAvatar, rr.score as rating
      FROM rate_comments rc
      LEFT JOIN users u ON rc.user_id = u.id
      LEFT JOIN rate_ratings rr ON rc.rating_id = rr.id
      WHERE rc.option_id = ?
      ORDER BY rc.likes DESC, rc.created_at DESC
    `;
    
    if (limit > 0) {
      query += ` LIMIT ?`;
    }
    
    const params = limit > 0 ? [optionId, limit] : [optionId];
    const [comments] = await db.query(query, params);
    
    return comments;
  }
  
  // 创建评分贴
  static async create(userId, { title, description, category, options }) {
    // 使用事务处理创建评分贴
    await db.query('START TRANSACTION');
    
    try {
      // 插入评分贴
      const [postResult] = await db.query(
        `INSERT INTO rate_posts (title, description, category, user_id)
         VALUES (?, ?, ?, ?)`,
        [title, description, category, userId]
      );
      
      const postId = postResult.insertId;
      
      // 插入评分选项
      for (const option of options) {
        await db.query(
          `INSERT INTO rate_options (post_id, name, avatar)
           VALUES (?, ?, ?)`,
          [postId, option.name, option.avatar]
        );
      }
      
      await db.query('COMMIT');
      
      return { id: postId };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
  
  // 添加评分
  static async addRating(userId, optionId, score) {
    // 使用事务处理添加评分
    await db.query('START TRANSACTION');
    
    try {
      // 查询是否已经有评分记录
      const [existingRatings] = await db.query(
        `SELECT * FROM rate_ratings WHERE user_id = ? AND option_id = ?`,
        [userId, optionId]
      );
      
      let ratingId;
      
      if (existingRatings.length > 0) {
        // 更新现有评分
        await db.query(
          `UPDATE rate_ratings SET score = ? WHERE user_id = ? AND option_id = ?`,
          [score, userId, optionId]
        );
        ratingId = existingRatings[0].id;
      } else {
        // 插入新评分
        const [ratingResult] = await db.query(
          `INSERT INTO rate_ratings (user_id, option_id, score)
           VALUES (?, ?, ?)`,
          [userId, optionId, score]
        );
        ratingId = ratingResult.insertId;
      }
      
      // 获取评分贴ID
      const [optionResult] = await db.query(
        `SELECT post_id FROM rate_options WHERE id = ?`,
        [optionId]
      );
      
      if (optionResult.length > 0) {
        const postId = optionResult[0].post_id;
        
        // 手动更新选项的平均分和评分人数
        await this.updateOptionStats(optionId);
        
        // 手动更新评分贴的总评分人数
        await this.updatePostTotalRatings(postId);
      }
      
      await db.query('COMMIT');
      
      return { id: ratingId };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
  
  // 更新选项的评分统计
  static async updateOptionStats(optionId) {
    await db.query(
      `UPDATE rate_options SET 
        avg_score = (SELECT AVG(score) FROM rate_ratings WHERE option_id = ?),
        ratings_count = (SELECT COUNT(*) FROM rate_ratings WHERE option_id = ?)
      WHERE id = ?`,
      [optionId, optionId, optionId]
    );
  }
  
  // 更新评分贴的总评分人数
  static async updatePostTotalRatings(postId) {
    await db.query(
      `UPDATE rate_posts SET total_ratings = (
        SELECT COUNT(DISTINCT user_id) FROM rate_ratings 
        WHERE option_id IN (SELECT id FROM rate_options WHERE post_id = ?)
      ) WHERE id = ?`,
      [postId, postId]
    );
  }
  
  // 添加评论
  static async addComment(userId, optionId, content) {
    // 使用事务处理添加评论
    await db.query('START TRANSACTION');
    
    try {
      // 查询用户对该选项的评分
      const [ratings] = await db.query(
        `SELECT id FROM rate_ratings WHERE user_id = ? AND option_id = ?`,
        [userId, optionId]
      );
      
      const ratingId = ratings.length > 0 ? ratings[0].id : null;
      
      // 插入评论
      const [commentResult] = await db.query(
        `INSERT INTO rate_comments (user_id, option_id, content, rating_id)
         VALUES (?, ?, ?, ?)`,
        [userId, optionId, content, ratingId]
      );
      
      await db.query('COMMIT');
      
      // 获取完整的评论信息用于返回
      const [comments] = await db.query(
        `SELECT rc.*, u.username, u.avatar as userAvatar, rr.score as rating
         FROM rate_comments rc
         LEFT JOIN users u ON rc.user_id = u.id
         LEFT JOIN rate_ratings rr ON rc.rating_id = rr.id
         WHERE rc.id = ?`,
        [commentResult.insertId]
      );
      
      return comments[0];
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
  
  // 点赞评论
  static async likeComment(userId, commentId) {
    // 使用事务处理点赞
    await db.query('START TRANSACTION');
    
    try {
      // 查询是否已点赞
      const [existingLikes] = await db.query(
        `SELECT * FROM rate_comment_likes WHERE user_id = ? AND comment_id = ?`,
        [userId, commentId]
      );
      
      let liked = false;
      
      if (existingLikes.length > 0) {
        // 取消点赞
        await db.query(
          `DELETE FROM rate_comment_likes WHERE user_id = ? AND comment_id = ?`,
          [userId, commentId]
        );
        
        // 更新评论点赞数
        await db.query(
          `UPDATE rate_comments SET likes = likes - 1 WHERE id = ?`,
          [commentId]
        );
      } else {
        // 添加点赞
        await db.query(
          `INSERT INTO rate_comment_likes (user_id, comment_id)
           VALUES (?, ?)`,
          [userId, commentId]
        );
        
        // 更新评论点赞数
        await db.query(
          `UPDATE rate_comments SET likes = likes + 1 WHERE id = ?`,
          [commentId]
        );
        
        liked = true;
      }
      
      await db.query('COMMIT');
      
      // 获取最新点赞数
      const [comments] = await db.query(
        `SELECT likes FROM rate_comments WHERE id = ?`,
        [commentId]
      );
      
      return {
        liked,
        likes: comments[0].likes
      };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
  
  // 检查用户是否已对评论点赞
  static async checkLiked(userId, commentIds) {
    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return {};
    }
    
    const [likes] = await db.query(
      `SELECT comment_id FROM rate_comment_likes WHERE user_id = ? AND comment_id IN (?)`,
      [userId, commentIds]
    );
    
    const likedMap = {};
    likes.forEach(like => {
      likedMap[like.comment_id] = true;
    });
    
    return likedMap;
  }
  
  // 检查用户是否已对选项评分
  static async getUserRatings(userId, postId) {
    const [ratings] = await db.query(
      `SELECT rr.option_id, rr.score
       FROM rate_ratings rr
       JOIN rate_options ro ON rr.option_id = ro.id
       WHERE rr.user_id = ? AND ro.post_id = ?`,
      [userId, postId]
    );
    
    const ratingsMap = {};
    ratings.forEach(rating => {
      ratingsMap[rating.option_id] = rating.score;
    });
    
    return ratingsMap;
  }
  
  // 检查用户是否对特定选项评分
  static async hasUserRatedOption(userId, optionId) {
    const [result] = await db.query(
      `SELECT COUNT(*) as count
       FROM rate_ratings
       WHERE user_id = ? AND option_id = ?`,
      [userId, optionId]
    );
    
    return result[0].count > 0;
  }
}

module.exports = RatePost; 