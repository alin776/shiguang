const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/database');

// 管理员登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证请求参数
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }
    
    // 查找管理员
    const admin = await Admin.findByUsername(username);
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
    
    // 验证密码（不使用加密）
    if (password !== admin.password) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
    
    // 更新最后登录时间
    await Admin.updateLastLogin(admin.id);
    
    // 生成JWT令牌
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username,
        role: admin.role
      }, 
      config.jwtSecret, 
      { expiresIn: '24h' }
    );
    
    // 返回登录成功信息和令牌
    return res.status(200).json({
      success: true,
      message: '登录成功',
      token,
      data: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取管理员信息
exports.getProfile = async (req, res) => {
  try {
    const adminId = req.admin.id;
    
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: '管理员不存在' 
      });
    }
    
    // 返回管理员信息，不包含密码
    return res.status(200).json({
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        last_login: admin.last_login,
        created_at: admin.created_at
      }
    });
  } catch (error) {
    console.error('获取管理员信息失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 创建管理员（仅超级管理员可以操作）
exports.createAdmin = async (req, res) => {
  try {
    // 检查当前用户是否是超级管理员
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限执行此操作' 
      });
    }
    
    const { username, password, name, email, role } = req.body;
    
    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }
    
    // 检查用户名是否已存在
    const existingAdmin = await Admin.findByUsername(username);
    if (existingAdmin) {
      return res.status(409).json({ 
        success: false, 
        message: '用户名已存在' 
      });
    }
    
    // 创建管理员
    const newAdmin = await Admin.create({
      username,
      password,
      name,
      email,
      role
    });
    
    // 返回新创建的管理员信息，不包含密码
    return res.status(201).json({
      success: true,
      message: '管理员创建成功',
      data: {
        id: newAdmin.id,
        username: newAdmin.username,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        created_at: newAdmin.created_at
      }
    });
  } catch (error) {
    console.error('创建管理员失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取所有管理员列表（仅超级管理员可以操作）
exports.getAllAdmins = async (req, res) => {
  try {
    // 检查当前用户是否是超级管理员
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: '没有权限执行此操作' 
      });
    }
    
    const admins = await Admin.findAll();
    
    return res.status(200).json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('获取管理员列表失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取仪表盘数据
exports.getDashboardData = async (req, res) => {
  try {
    // 获取帖子总数
    const [postCount] = await db.execute('SELECT COUNT(*) as count FROM posts');
    
    // 获取用户总数
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    
    // 获取评论总数
    const [commentCount] = await db.execute('SELECT COUNT(*) as count FROM comments');
    
    // 获取最近活动（最新10条用户注册、帖子发布、评论等）
    const [recentActivities] = await db.execute(`
      (SELECT 
        'post' as type,
        p.id,
        p.title as content,
        u.username,
        p.created_at as time
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 5)
      
      UNION ALL
      
      (SELECT 
        'user' as type,
        u.id,
        '新用户注册' as content,
        u.username,
        u.created_at as time
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 5)
      
      UNION ALL
      
      (SELECT 
        'comment' as type,
        c.id,
        SUBSTRING(c.content, 1, 50) as content,
        u.username,
        c.created_at as time
      FROM comments c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 5)
      
      ORDER BY time DESC
      LIMIT 10
    `);
    
    // 处理活动数据
    const formattedActivities = recentActivities.map(item => ({
      id: `${item.type}_${item.id}`,
      type: item.type,
      content: item.type === 'user' 
        ? `用户 ${item.username} 注册了账号`
        : item.type === 'post'
          ? `用户 ${item.username} 发布了帖子: ${item.content}`
          : `用户 ${item.username} 发表了评论: ${item.content}`,
      time: new Date(item.time).toISOString()
    }));
    
    res.json({
      postCount: postCount[0].count,
      userCount: userCount[0].count,
      commentCount: commentCount[0].count,
      recentActivities: formattedActivities
    });
    
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json({ message: '获取仪表盘数据失败' });
  }
};

// 获取所有小记（管理员接口）
exports.getAllNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const orderBy = req.query.sort === 'oldest' ? 'ASC' : 'DESC';
    
    // 构建查询条件
    let whereClause = '';
    const queryParams = [];
    
    if (search) {
      whereClause = 'WHERE n.content LIKE ? OR u.username LIKE ?';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // 获取总数
    const [total] = await db.execute(`
      SELECT COUNT(*) as total 
      FROM notes n
      JOIN users u ON n.author_id = u.id
      ${whereClause}
    `, queryParams);
    
    // 获取小记列表
    const [notes] = await db.execute(`
      SELECT 
        n.id, 
        n.content, 
        n.image, 
        n.likes, 
        n.created_at, 
        u.id AS author_id, 
        u.username AS author_name, 
        u.avatar 
      FROM 
        notes n
      JOIN 
        users u ON n.author_id = u.id
      ${whereClause}
      ORDER BY 
        n.created_at ${orderBy}
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);
    
    // 转换结果格式
    const formattedNotes = notes.map(note => ({
      id: note.id,
      content: note.content,
      author: {
        id: note.author_id,
        username: note.author_name
      },
      image: note.image,
      likes: note.likes,
      createdAt: new Date(note.created_at).toISOString()
    }));
    
    res.json({
      notes: formattedNotes,
      pagination: {
        total: total[0].total,
        page,
        limit,
        pages: Math.ceil(total[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取小记列表失败:', error);
    res.status(500).json({ message: '获取小记列表失败' });
  }
};

// 创建小记（管理员接口）
exports.createNote = async (req, res) => {
  try {
    const { content, authorId, image } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: '内容不能为空' });
    }
    
    if (!authorId) {
      return res.status(400).json({ message: '作者ID不能为空' });
    }
    
    // 检查用户是否存在
    const [user] = await db.execute('SELECT id FROM users WHERE id = ?', [authorId]);
    if (user.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 创建小记
    const [result] = await db.execute(
      'INSERT INTO notes (content, author_id, image) VALUES (?, ?, ?)',
      [content, authorId, image || null]
    );
    
    // 获取创建的小记信息
    const [newNote] = await db.execute(`
      SELECT 
        n.id, 
        n.content, 
        n.image, 
        n.likes, 
        n.created_at, 
        u.id AS author_id, 
        u.username AS author_name
      FROM 
        notes n
      JOIN 
        users u ON n.author_id = u.id
      WHERE 
        n.id = ?
    `, [result.insertId]);
    
    if (newNote.length === 0) {
      return res.status(500).json({ message: '小记创建成功但无法获取详情' });
    }
    
    const note = newNote[0];
    res.status(201).json({
      message: '小记创建成功',
      note: {
        id: note.id,
        content: note.content,
        author: {
          id: note.author_id,
          username: note.author_name
        },
        image: note.image,
        likes: note.likes,
        createdAt: new Date(note.created_at).toISOString()
      }
    });
  } catch (error) {
    console.error('创建小记失败:', error);
    res.status(500).json({ message: '创建小记失败' });
  }
};

// 删除小记（管理员接口）
exports.deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    
    // 检查小记是否存在
    const [existingNote] = await db.execute('SELECT id FROM notes WHERE id = ?', [noteId]);
    if (existingNote.length === 0) {
      return res.status(404).json({ message: '小记不存在' });
    }
    
    // 删除小记
    await db.execute('DELETE FROM notes WHERE id = ?', [noteId]);
    
    res.json({ message: '小记删除成功' });
  } catch (error) {
    console.error('删除小记失败:', error);
    res.status(500).json({ message: '删除小记失败' });
  }
}; 