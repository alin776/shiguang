const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建数据库连接
const createConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
};

// 获取小记列表
exports.getNotes = async (req, res) => {
  let connection;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 查询小记并按时间倒序排列
    const query = `
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
      WHERE
        n.status = 'approved'
      ORDER BY 
        n.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `SELECT COUNT(*) AS total FROM notes WHERE status = 'approved'`;
    
    connection = await createConnection();
    const [notes] = await connection.execute(query, [limit, offset]);
    const [countResult] = await connection.execute(countQuery);
    
    const total = countResult[0].total;

    // 转换结果格式以匹配前端期望
    const formattedNotes = notes.map(note => ({
      _id: note.id,
      content: note.content,
      author: note.author_id,
      authorName: note.author_name,
      avatar: note.avatar,
      image: note.image,
      likes: note.likes,
      createdAt: note.created_at
    }));

    res.status(200).json({
      success: true,
      notes: formattedNotes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取小记列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取小记列表失败',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// 获取单个小记
exports.getNoteById = async (req, res) => {
  let connection;
  try {
    const userId = req.user ? req.user.id : null;
    const query = `
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
      WHERE 
        n.id = ? AND (n.status = 'approved' OR n.author_id = ?)
    `;
    
    connection = await createConnection();
    const [results] = await connection.execute(query, [req.params.id, userId]);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: '小记不存在'
      });
    }

    const note = results[0];
    const formattedNote = {
      _id: note.id,
      content: note.content,
      author: note.author_id,
      authorName: note.author_name,
      avatar: note.avatar,
      image: note.image,
      likes: note.likes,
      createdAt: note.created_at
    };

    res.status(200).json({
      success: true,
      note: formattedNote
    });
  } catch (error) {
    console.error('获取小记详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取小记详情失败',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// 创建小记
exports.createNote = async (req, res) => {
  let connection;
  try {
    const { content, image } = req.body;
    const userId = req.user.id;

    // 创建新小记
    const query = `INSERT INTO notes (content, author_id, image, status) VALUES (?, ?, ?, 'pending')`;
    
    connection = await createConnection();
    const [result] = await connection.execute(query, [content, userId, image || null]);
    
    // 获取创建的小记信息
    if (result.insertId) {
      const [userResult] = await connection.execute(
        `SELECT id, username, avatar FROM users WHERE id = ?`,
        [userId]
      );
      
      const [newNote] = await connection.execute(
        `SELECT * FROM notes WHERE id = ?`,
        [result.insertId]
      );
      
      if (userResult.length > 0 && newNote.length > 0) {
        const user = userResult[0];
        const note = newNote[0];
        
        res.status(201).json({
          success: true,
          message: '小记创建成功',
          note: {
            _id: note.id,
            content: note.content,
            author: user.id,
            authorName: user.username,
            avatar: user.avatar,
            image: note.image,
            likes: note.likes,
            createdAt: note.created_at
          }
        });
        return;
      }
    }
    
    res.status(201).json({
      success: true,
      message: '小记创建成功',
      noteId: result.insertId
    });
  } catch (error) {
    console.error('创建小记失败:', error);
    res.status(500).json({
      success: false,
      message: '创建小记失败',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// 点赞小记
exports.likeNote = async (req, res) => {
  let connection;
  try {
    const noteId = req.params.id;
    const userId = req.user.id;
    
    console.log('收到点赞请求:', { noteId, userId });
    
    connection = await createConnection();
    await connection.beginTransaction();
    
    try {
      // 检查小记是否存在
      const [noteExists] = await connection.execute(
        `SELECT id FROM notes WHERE id = ?`,
        [noteId]
      );
      
      console.log('小记查询结果:', noteExists);
      
      if (noteExists.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: '小记不存在'
        });
      }
      
      // 检查用户是否已点赞
      const [likeExists] = await connection.execute(
        `SELECT id FROM note_likes WHERE note_id = ? AND user_id = ?`,
        [noteId, userId]
      );
      
      console.log('用户点赞状态:', { likeExists, count: likeExists.length });
      
      let message;
      if (likeExists.length > 0) {
        // 取消点赞
        await connection.execute(
          `DELETE FROM note_likes WHERE note_id = ? AND user_id = ?`,
          [noteId, userId]
        );
        message = '取消点赞成功';
        console.log('执行取消点赞');
      } else {
        // 添加点赞
        await connection.execute(
          `INSERT INTO note_likes (note_id, user_id) VALUES (?, ?)`,
          [noteId, userId]
        );
        message = '点赞成功';
        console.log('执行添加点赞');
      }
      
      // 更新小记点赞数量
      await connection.execute(
        `UPDATE notes SET likes = (SELECT COUNT(*) FROM note_likes WHERE note_id = ?) WHERE id = ?`,
        [noteId, noteId]
      );
      
      // 获取更新后的点赞数
      const [updatedNote] = await connection.execute(
        `SELECT likes FROM notes WHERE id = ?`,
        [noteId]
      );
      
      await connection.commit();
      
      const response = {
        success: true,
        message,
        likes: updatedNote[0].likes,
        isLiked: likeExists.length === 0 // 如果之前不存在点赞，现在就是点赞状态
      };
      
      console.log('点赞响应:', response);
      
      res.status(200).json(response);
    } catch (error) {
      await connection.rollback();
      console.error('点赞事务错误:', error);
      throw error;
    }
  } catch (error) {
    console.error('操作点赞失败:', error);
    res.status(500).json({
      success: false,
      message: '操作点赞失败',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// 删除小记(只能删除自己的)
exports.deleteNote = async (req, res) => {
  let connection;
  try {
    const noteId = req.params.id;
    const userId = req.user.id;
    
    connection = await createConnection();
    
    // 检查小记是否存在且是用户自己的
    const [note] = await connection.execute(
      `SELECT id, author_id FROM notes WHERE id = ?`,
      [noteId]
    );
    
    if (note.length === 0) {
      return res.status(404).json({
        success: false,
        message: '小记不存在'
      });
    }
    
    // 检查是否是作者本人
    if (note[0].author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权删除此小记'
      });
    }
    
    // 删除小记
    await connection.execute(
      `DELETE FROM notes WHERE id = ?`,
      [noteId]
    );
    
    res.status(200).json({
      success: true,
      message: '小记删除成功'
    });
  } catch (error) {
    console.error('删除小记失败:', error);
    res.status(500).json({
      success: false,
      message: '删除小记失败',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// 获取用户自己的小记
exports.getUserNotes = async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const query = `
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
      WHERE 
        n.author_id = ?
      ORDER BY 
        n.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `SELECT COUNT(*) AS total FROM notes WHERE author_id = ?`;
    
    connection = await createConnection();
    const [notes] = await connection.execute(query, [userId, limit, offset]);
    const [countResult] = await connection.execute(countQuery, [userId]);
    
    const total = countResult[0].total;
    
    // 转换结果格式以匹配前端期望
    const formattedNotes = notes.map(note => ({
      _id: note.id,
      content: note.content,
      author: note.author_id,
      authorName: note.author_name,
      avatar: note.avatar,
      image: note.image,
      likes: note.likes,
      createdAt: note.created_at
    }));

    res.status(200).json({
      success: true,
      notes: formattedNotes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户小记失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户小记失败',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
}; 