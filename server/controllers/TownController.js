const db = require('../config/database');

// 获取小镇页面所需的所有数据
exports.getTownData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取公告数据（最新3条）
    const [announcements] = await db.execute(`
      SELECT a.*, u.username as author_name, u.avatar as author_avatar 
      FROM announcements a 
      LEFT JOIN users u ON a.author_id = u.id 
      ORDER BY a.created_at DESC
      LIMIT 3
    `);
    
    // 获取论坛统计数据
    const [postsCountResult] = await db.execute(
      'SELECT COUNT(*) as count FROM posts WHERE status = "approved"'
    );
    
    const [topicsCountResult] = await db.execute(
      'SELECT COUNT(DISTINCT category_id) as count FROM posts WHERE status = "approved"'
    );
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const [dailyPostsResult] = await db.execute(
      'SELECT COUNT(*) as count FROM posts WHERE status = "approved" AND created_at >= ?',
      [todayStart]
    );
    
    // 获取热门帖子
    const [hotPosts] = await db.execute(`
      SELECT 
        p.id, p.title, p.content, p.user_id, p.likes, p.views, p.created_at, p.images,
        u.username, u.avatar,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'approved') as comment_count,
        c.name as category_name
      FROM 
        posts p
      LEFT JOIN
        users u ON p.user_id = u.id
      LEFT JOIN
        categories c ON p.category_id = c.id
      WHERE
        p.status = 'approved'
      ORDER BY 
        (p.likes * 3 + p.views + comment_count * 2) DESC
      LIMIT 5
    `);
    
    // 为帖子处理用户信息和图片
    const processedPosts = hotPosts.map(post => {
      const processedPost = { ...post };
      
      // 处理图片
      if (post.images) {
        try {
          processedPost.images = JSON.parse(post.images);
        } catch (e) {
          processedPost.images = [];
        }
      } else {
        processedPost.images = [];
      }
      
      // 构造用户信息
      processedPost.user = {
        id: post.user_id,
        username: post.username,
        avatar: post.avatar
      };
      
      // 删除多余字段
      delete processedPost.username;
      delete processedPost.avatar;
      
      return processedPost;
    });
    
    // 返回所有数据
    return res.json({
      announcements,
      forumStats: {
        topics: topicsCountResult[0].count,
        posts: postsCountResult[0].count,
        daily: dailyPostsResult[0].count
      },
      hotPosts: processedPosts
    });
    
  } catch (error) {
    console.error('获取小镇数据失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取论坛统计数据
exports.getForumStats = async (req, res) => {
  try {
    // 获取总帖子数
    const [postsCountResult] = await db.execute(
      'SELECT COUNT(*) as count FROM posts WHERE status = "approved"'
    );
    
    // 获取主题数（分类数量）
    const [topicsCountResult] = await db.execute(
      'SELECT COUNT(DISTINCT category_id) as count FROM posts WHERE status = "approved"'
    );
    
    // 获取今日发帖数
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const [dailyPostsResult] = await db.execute(
      'SELECT COUNT(*) as count FROM posts WHERE status = "approved" AND created_at >= ?',
      [todayStart]
    );
    
    return res.json({
      topics: topicsCountResult[0].count,
      posts: postsCountResult[0].count,
      daily: dailyPostsResult[0].count
    });
  } catch (error) {
    console.error('获取论坛统计数据失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}; 