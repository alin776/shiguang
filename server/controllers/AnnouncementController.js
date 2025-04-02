const db = require('../config/database');
const { validationResult } = require('express-validator');
const { handleFileUpload } = require('../utils/fileUploader');

// 获取所有公告
exports.getAnnouncements = async (req, res) => {
  try {
    const [announcements] = await db.execute(`
      SELECT a.*, u.username as author_name, u.avatar as author_avatar 
      FROM announcements a 
      LEFT JOIN users u ON a.author_id = u.id 
      ORDER BY a.created_at DESC
    `);
    
    return res.json({ announcements });
  } catch (error) {
    console.error('获取公告列表失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个公告详情
exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [announcements] = await db.execute(`
      SELECT a.*, u.username, u.avatar 
      FROM announcements a 
      LEFT JOIN users u ON a.author_id = u.id 
      WHERE a.id = ?
    `, [id]);
    
    if (announcements.length === 0) {
      return res.status(404).json({ message: '找不到该公告' });
    }
    
    const announcement = announcements[0];
    
    // 解析图片JSON
    if (announcement.images) {
      try {
        announcement.images = JSON.parse(announcement.images);
      } catch (e) {
        announcement.images = [];
      }
    } else {
      announcement.images = [];
    }
    
    // 构造作者信息
    announcement.author = {
      id: announcement.author_id,
      username: announcement.username,
      avatar: announcement.avatar
    };
    
    // 删除多余字段
    delete announcement.username;
    delete announcement.avatar;
    
    return res.json({ announcement });
  } catch (error) {
    console.error('获取公告详情失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 创建新公告
exports.createAnnouncement = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, content } = req.body;
    const author_id = req.user.id;
    
    // 检查是否为管理员
    if (!req.user.is_admin) {
      return res.status(403).json({ message: '只有管理员才能创建公告' });
    }
    
    let images = [];
    
    // 处理图片上传
    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map(file => handleFileUpload(file, 'announcements'))
      );
      images = uploadedImages.filter(Boolean);
    }

    // 插入公告记录
    const [result] = await db.execute(
      'INSERT INTO announcements (title, content, author_id, images) VALUES (?, ?, ?, ?)',
      [title, content, author_id, JSON.stringify(images)]
    );
    
    // 获取创建的公告
    const [announcements] = await db.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [result.insertId]
    );
    
    // 发送系统通知给所有用户
    await db.execute(
      'INSERT INTO notifications (actor_id, content, type, source_type, source_id) SELECT ?, ?, ?, ?, ? FROM users',
      [author_id, `发布了新公告: ${title}`, 'system', 'announcement', result.insertId]
    );
    
    return res.status(201).json({ 
      message: '公告创建成功',
      announcement: announcements[0]
    });
  } catch (error) {
    console.error('创建公告失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 更新公告
exports.updateAnnouncement = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { title, content } = req.body;
    
    // 检查公告是否存在
    const [announcements] = await db.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    if (announcements.length === 0) {
      return res.status(404).json({ message: '找不到该公告' });
    }
    
    // 检查是否为管理员
    if (!req.user.is_admin) {
      return res.status(403).json({ message: '只有管理员才能更新公告' });
    }
    
    let images = announcements[0].images;
    
    // 处理图片上传
    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map(file => handleFileUpload(file, 'announcements'))
      );
      images = JSON.stringify(uploadedImages.filter(Boolean));
    }

    // 更新公告
    await db.execute(
      'UPDATE announcements SET title = ?, content = ?, images = ? WHERE id = ?',
      [title, content, images, id]
    );
    
    // 获取更新后的公告
    const [updatedAnnouncements] = await db.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    return res.json({ 
      message: '公告更新成功',
      announcement: updatedAnnouncements[0]
    });
  } catch (error) {
    console.error('更新公告失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 删除公告
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查公告是否存在
    const [announcements] = await db.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    if (announcements.length === 0) {
      return res.status(404).json({ message: '找不到该公告' });
    }
    
    // 检查是否为管理员
    if (!req.user.is_admin) {
      return res.status(403).json({ message: '只有管理员才能删除公告' });
    }
    
    // 删除公告
    await db.execute('DELETE FROM announcements WHERE id = ?', [id]);
    
    return res.json({ message: '公告删除成功' });
  } catch (error) {
    console.error('删除公告失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};
