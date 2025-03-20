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
    
    // 获取最近7天的用户增长数据
    const [userGrowth] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    // 获取最近7天的帖子增长数据
    const [postGrowth] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM posts
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    // 获取最近7天的评论增长数据
    const [commentGrowth] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM comments
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    // 获取最近7天的用户活跃度数据（基于登录、发帖、评论等活动）
    const [userActivity] = await db.execute(`
      SELECT 
        DATE(activity_date) as date,
        COUNT(DISTINCT user_id) as active_users
      FROM (
        SELECT user_id, DATE(created_at) as activity_date FROM posts
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        UNION ALL
        SELECT user_id, DATE(created_at) as activity_date FROM comments
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        UNION ALL
        SELECT id as user_id, DATE(updated_at) as activity_date FROM users
        WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ) as activities
      GROUP BY date
      ORDER BY date
    `);
    
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
    
    // 格式化日期函数
    const formatGrowthData = (data, days = 7) => {
      const result = [];
      const today = new Date();
      
      // 创建过去7天的日期映射
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          count: 0
        });
      }
      
      // 用实际数据填充
      data.forEach(item => {
        const dateStr = new Date(item.date).toISOString().split('T')[0];
        const existingData = result.find(d => d.date === dateStr);
        if (existingData) {
          existingData.count = parseInt(item.count);
        }
      });
      
      return result;
    };
    
    res.json({
      postCount: postCount[0].count,
      userCount: userCount[0].count,
      commentCount: commentCount[0].count,
      userGrowth: formatGrowthData(userGrowth),
      postGrowth: formatGrowthData(postGrowth),
      commentGrowth: formatGrowthData(commentGrowth),
      userActivity: formatGrowthData(userActivity),
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

// 获取所有任务
exports.getAllTasks = async (req, res) => {
  try {
    // 查询所有任务
    const [tasks] = await db.execute(
      `SELECT * FROM tasks ORDER BY id ASC`
    );
    
    res.json({ tasks });
  } catch (error) {
    console.error("获取任务列表失败:", error);
    res.status(500).json({ message: "获取任务列表失败" });
  }
};

// 获取任务详情
exports.getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const [tasks] = await db.execute(
      `SELECT 
        id, title, description, reward, target, 
        task_type, is_active, created_at, updated_at
      FROM tasks 
      WHERE id = ?`,
      [taskId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    const task = tasks[0];
    
    // 查询任务完成情况统计（最近7天）
    const [completionStats] = await db.execute(
      `SELECT 
        DATE(completed_at) as date, 
        COUNT(*) as count
      FROM user_tasks
      WHERE task_type = ? AND completed_at IS NOT NULL
      AND completed_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
      GROUP BY DATE(completed_at)
      ORDER BY date ASC`,
      [task.task_type]
    );
    
    // 格式化任务数据
    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.task_type,
      exp_reward: task.reward,
      daily_limit: task.target,
      status: task.is_active ? 'active' : 'inactive',
      created_at: task.created_at,
      updated_at: task.updated_at,
      completionStats
    };
    
    res.json(formattedTask);
  } catch (error) {
    console.error('获取任务详情失败:', error);
    res.status(500).json({ message: '获取任务详情失败' });
  }
};

// 获取任务列表
exports.getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const orderBy = req.query.orderBy || 'created_at';
    const orderDirection = req.query.orderDirection || 'DESC';
    
    // 构建查询条件
    let whereClause = '';
    const queryParams = [];
    
    if (search) {
      whereClause = `WHERE title LIKE ? OR description LIKE ?`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // 查询任务总数
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM tasks ${whereClause}`,
      queryParams
    );
    
    const total = countResult[0].total;
    
    // 查询任务列表
    const [tasks] = await db.execute(
      `SELECT 
        id, title, description, reward, target, 
        created_at, updated_at, is_active, task_type
      FROM tasks 
      ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    // 格式化任务数据以匹配前端期望
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.task_type,
      exp_reward: task.reward,
      daily_limit: task.target,
      status: task.is_active ? 'active' : 'inactive',
      created_at: task.created_at,
      updated_at: task.updated_at
    }));
    
    res.json({
      total,
      tasks: formattedTasks,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({ message: '获取任务列表失败' });
  }
};

// 创建任务
exports.createTask = async (req, res) => {
  try {
    const { title, description, type, expReward, dailyLimit, status } = req.body;
    
    // 验证必填字段
    if (!title || !description || !type) {
      return res.status(400).json({ message: '标题、描述和类型为必填字段' });
    }
    
    // 插入任务
    const [result] = await db.execute(
      `INSERT INTO tasks (
        title, description, reward, target, is_active, task_type
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        expReward || 0,
        dailyLimit || 1,
        status === 'active' ? 1 : 0,
        type
      ]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: '任务创建成功'
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ message: '创建任务失败' });
  }
};

// 更新任务
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, type, expReward, dailyLimit, status } = req.body;
    
    // 检查任务是否存在
    const [tasks] = await db.execute(
      'SELECT id FROM tasks WHERE id = ?',
      [taskId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    // 构建更新字段
    const updateFields = [];
    const queryParams = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      queryParams.push(title);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      queryParams.push(description);
    }
    
    if (expReward !== undefined) {
      updateFields.push('reward = ?');
      queryParams.push(expReward);
    }
    
    if (dailyLimit !== undefined) {
      updateFields.push('target = ?');
      queryParams.push(dailyLimit);
    }
    
    if (status !== undefined) {
      updateFields.push('is_active = ?');
      queryParams.push(status === 'active' ? 1 : 0);
    }
    
    if (type !== undefined) {
      updateFields.push('task_type = ?');
      queryParams.push(type);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: '没有提供需要更新的字段' });
    }
    
    // 添加更新时间
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // 执行更新
    await db.execute(
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`,
      [...queryParams, taskId]
    );
    
    res.json({ message: '任务更新成功' });
  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({ message: '更新任务失败' });
  }
};

// 删除任务
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // 检查任务是否存在
    const [tasks] = await db.execute(
      'SELECT id FROM tasks WHERE id = ?',
      [taskId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    // 执行删除任务操作
    await db.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
    
    res.json({ message: '任务删除成功' });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ message: '删除任务失败' });
  }
};

// 获取系统设置值
exports.getSystemSetting = async (req, res) => {
  try {
    const key = req.params.key;
    
    // 获取设置值
    const [settings] = await db.execute(
      `SELECT * FROM system_settings WHERE \`key\` = ?`,
      [key]
    );
    
    if (settings.length === 0) {
      return res.status(404).json({ message: "设置不存在" });
    }
    
    res.json({
      key: settings[0].key,
      value: settings[0].value,
      description: settings[0].description
    });
  } catch (error) {
    console.error("获取系统设置失败:", error);
    res.status(500).json({ message: "获取系统设置失败" });
  }
};

// 更新系统设置值
exports.updateSystemSetting = async (req, res) => {
  try {
    const key = req.params.key;
    const { value } = req.body;
    
    // 验证参数
    if (!value) {
      return res.status(400).json({ message: "缺少value参数" });
    }
    
    // 检查设置是否存在
    const [settings] = await db.execute(
      `SELECT * FROM system_settings WHERE \`key\` = ?`,
      [key]
    );
    
    if (settings.length === 0) {
      return res.status(404).json({ message: "设置不存在" });
    }
    
    // 更新设置值
    await db.execute(
      `UPDATE system_settings SET value = ? WHERE \`key\` = ?`,
      [value, key]
    );
    
    res.json({ message: "设置更新成功" });
  } catch (error) {
    console.error("更新系统设置失败:", error);
    res.status(500).json({ message: "更新系统设置失败" });
  }
};

// 获取用户列表
exports.getUserList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const orderBy = req.query.orderBy || 'created_at';
    const orderDirection = req.query.orderDirection || 'DESC';
    
    // 构建查询条件
    let whereClause = '';
    const queryParams = [];
    
    if (search) {
      whereClause = `WHERE username LIKE ? OR email LIKE ? OR phone LIKE ?`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // 处理排序字段名称映射
    let dbOrderBy = orderBy;
    if (orderBy === 'exp_points') {
      dbOrderBy = 'experience';
    } else if (orderBy === 'last_login_at') {
      dbOrderBy = 'last_active';
    }
    
    // 查询用户总数
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    
    const total = countResult[0].total;
    
    // 查询用户列表
    const [users] = await db.execute(
      `SELECT 
        id, username, email, phone, avatar, bio, created_at, last_active,
        status, experience, level
      FROM users 
      ${whereClause}
      ORDER BY ${dbOrderBy} ${orderDirection}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    // 处理用户数据
    const formattedUsers = users.map(user => {
      // 将status转换为字符串以确保一致的比较
      const statusStr = String(user.status).toLowerCase();
      console.log('User status in DB:', user.username, statusStr, typeof user.status);
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
        createdAt: user.created_at,
        lastLoginAt: user.last_active,
        status: statusStr.includes('online') ? '已启用' : '已禁用',
        experience: user.experience || 0,
        level: user.level || 1
      };
    });
    
    res.json({
      total,
      users: formattedUsers,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
};

// 获取用户详情
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 查询用户信息
    const [users] = await db.execute(
      `SELECT 
        id, username, email, phone, avatar, bio, created_at, last_active,
        status, experience, level
      FROM users 
      WHERE id = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    const user = users[0];
    
    // 查询用户发帖数
    const [postCountResult] = await db.execute(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
      [userId]
    );
    
    // 查询用户评论数
    const [commentCountResult] = await db.execute(
      'SELECT COUNT(*) as count FROM comments WHERE user_id = ?',
      [userId]
    );
    
    // 查询用户获赞数
    const [likesReceivedResult] = await db.execute(
      `SELECT COUNT(*) as count FROM likes
       WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)`,
      [userId]
    );
    
    // 将status转换为字符串以确保一致的比较
    const statusStr = String(user.status).toLowerCase();
    console.log('User detail status in DB:', user.username, statusStr, typeof user.status);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
      createdAt: user.created_at,
      lastLoginAt: user.last_active,
      status: statusStr.includes('online') ? '已启用' : '已禁用',
      experience: user.experience || 0,
      level: user.level || 1,
      stats: {
        posts: postCountResult[0].count,
        comments: commentCountResult[0].count,
        likesReceived: likesReceivedResult[0].count
      }
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ message: '获取用户详情失败' });
  }
};

// 更新用户信息
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, phone, bio, status, experience } = req.body;
    
    // 检查用户是否存在
    const [users] = await db.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 如果要更新用户名，检查是否已存在
    if (username) {
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: '用户名已存在' });
      }
    }
    
    // 如果要更新邮箱，检查是否已存在
    if (email) {
      const [existingEmails] = await db.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingEmails.length > 0) {
        return res.status(400).json({ message: '邮箱已存在' });
      }
    }
    
    // 构建更新字段
    const updateFields = [];
    const queryParams = [];
    
    if (username) {
      updateFields.push('username = ?');
      queryParams.push(username);
    }
    
    if (email) {
      updateFields.push('email = ?');
      queryParams.push(email);
    }
    
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      queryParams.push(phone || null);
    }
    
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      queryParams.push(bio || null);
    }
    
    if (status) {
      updateFields.push('status = ?');
      // 转换前端状态值为数据库值
      const dbStatus = status === '已启用' ? 'online' : 'offline';
      console.log('更新用户状态:', status, '->', dbStatus);
      queryParams.push(dbStatus);
    }
    
    // 添加经验值更新逻辑
    if (experience !== undefined) {
      updateFields.push('experience = ?');
      queryParams.push(parseInt(experience) || 0);
      console.log('更新用户经验值:', experience);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: '没有提供需要更新的字段' });
    }
    
    // 执行更新
    await db.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      [...queryParams, userId]
    );
    
    res.json({ message: '用户信息更新成功' });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ message: '更新用户信息失败' });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 检查用户是否存在
    const [users] = await db.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 执行删除用户操作
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ message: '删除用户失败' });
  }
};

// 删除帖子（管理员权限）
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    console.log(`尝试删除帖子，ID: ${postId}`);
    
    // 检查帖子是否存在
    const [posts] = await db.execute(
      "SELECT * FROM posts WHERE id = ?",
      [postId]
    );
    
    console.log(`查询结果: 找到 ${posts.length} 个帖子`);
    if (posts.length > 0) {
      console.log(`帖子信息:`, JSON.stringify(posts[0]));
    }
    
    if (posts.length === 0) {
      console.log(`未找到ID为 ${postId} 的帖子`);
      return res.status(404).json({ message: "帖子不存在" });
    }
    
    // 管理员有权直接删除任何帖子，无需检查用户权限
    console.log(`准备删除帖子，ID: ${postId}`);
    await db.execute("DELETE FROM posts WHERE id = ?", [postId]);
    console.log(`帖子已删除，ID: ${postId}`);
    
    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除帖子失败:", error);
    res.status(500).json({ message: "删除失败" });
  }
};

module.exports = {
  login: exports.login,
  getProfile: exports.getProfile,
  getAllPosts: exports.getAllPosts,
  getPostById: exports.getPostById,
  updatePost: exports.updatePost,
  deletePost: exports.deletePost,
  getFeedbacks: exports.getFeedbacks,
  updateFeedbackStatus: exports.updateFeedbackStatus,
  getAllNotes: exports.getAllNotes,
  createNote: exports.createNote,
  deleteNote: exports.deleteNote,
  getAppVersions: exports.getAppVersions,
  createAppVersion: exports.createAppVersion,
  updateAppVersion: exports.updateAppVersion,
  deleteAppVersion: exports.deleteAppVersion,
  getCategories: exports.getCategories,
  getCategoryById: exports.getCategoryById,
  createCategory: exports.createCategory,
  updateCategory: exports.updateCategory,
  deleteCategory: exports.deleteCategory,
  getAllTasks: exports.getAllTasks,
  getTaskById: exports.getTaskById,
  createTask: exports.createTask,
  updateTask: exports.updateTask,
  deleteTask: exports.deleteTask,
  updateSystemSetting: exports.updateSystemSetting,
  getSystemSetting: exports.getSystemSetting,
  getUserList: exports.getUserList,
  getUserById: exports.getUserById,
  updateUser: exports.updateUser,
  deleteUser: exports.deleteUser,
  getTasks: exports.getTasks,
  getDashboardData: exports.getDashboardData,
  createAdmin: exports.createAdmin,
  getAllAdmins: exports.getAllAdmins
}; 