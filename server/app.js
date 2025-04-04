require("dotenv").config();
// 打印环境变量信息
console.log('环境变量加载情况:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- EMAIL_USER存在:', !!process.env.EMAIL_USER);
console.log('- EMAIL_PASS存在:', !!process.env.EMAIL_PASS);

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const communityRoutes = require("./routes/communityRoutes");
const updateActivity = require("./middleware/updateActivity");
const notificationRoutes = require("./routes/notificationRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const checkInRoutes = require("./routes/checkInRoutes");
const noteRoutes = require("./routes/noteRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const updateRoutes = require("./routes/updateRoutes");
const adminRoutes = require("./routes/adminRoutes");
const taskRoutes = require("./routes/taskRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const townRoutes = require("./routes/townRoutes");
const forumRoutes = require("./routes/forumRoutes");
const activityRoutes = require("./routes/activityRoutes");
const gameRoutes = require("./routes/gameRoutes");
const emailService = require("./services/emailService");
const titleService = require("./services/titleService");
const gameService = require("./services/gameService");
const scheduledTasks = require("./services/scheduledTasks");
const authRoutes = require("./routes/authRoutes");
const adViewRoutes = require("./routes/adViewRoutes");
const ratePostRoutes = require("./routes/ratePostRoutes");
const privateChatRoutes = require("./routes/privateChat");
const { body, param } = require('express-validator');
const schedule = require('node-schedule');
const privateChatModel = require('./models/privateChat');

const app = express();

// 创建上传目录
const uploadDir = path.join(__dirname, "public/uploads/avatars");
const coverDir = path.join(__dirname, "uploads/covers");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(coverDir)) {
  fs.mkdirSync(coverDir, { recursive: true });
}

// 静态文件服务
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // 允许所有来源访问静态资源
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  // 修复PNG文件的MIME类型
  const filePath = req.path;
  if (filePath.toLowerCase().endsWith('.png')) {
    res.type('image/png');
  } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
    res.type('image/jpeg');
  }
  
  console.log("静态资源请求:", {
    路径: req.path,
    MIME类型: res.get('Content-Type') || '未设置'
  });
  
  next();
}, express.static(path.join(__dirname, "public/uploads")));

app.use("/uploads/covers", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // 允许所有来源访问静态资源
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}, express.static("uploads/covers"));

// 添加静态文件服务配置，确保uploads目录可以被访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('已配置静态文件服务: /uploads -> ', path.join(__dirname, 'uploads'));

// 自定义CORS中间件，确保OPTIONS预检请求能被正确处理
app.use((req, res, next) => {
  // 对于预检请求，立即响应
  if (req.method === 'OPTIONS') {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Max-Age", "86400"); // 24小时内不再发送预检请求
    return res.status(204).end();
  }
  next();
});

// CORS 配置
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposedHeaders: ["Content-Length", "Content-Range"],
    maxAge: 86400, // 24小时内不再发送预检请求
  })
);

// 请求体解析中间件
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log("收到请求:", {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString(),
  });
  next();
});

// 测试路由
app.get("/api/test", (req, res) => {
  res.json({ message: "服务器连接正常" });
});

// 其他路由
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/events", eventRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/upload", uploadRoutes);
app.use(updateActivity);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/checkins", checkInRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/updates", updateRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/town", townRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/adview", adViewRoutes);
app.use("/api/rate-posts", ratePostRoutes);
app.use("/api/private-chats", privateChatRoutes);

// 初始化邮件服务
emailService.initMailer();

// 初始化称号服务
titleService.init();

// 初始化游戏服务
gameService.init();

// 初始化定时任务
scheduledTasks.init();

// 设置定时任务：每小时清理一次过期消息
const scheduledCleanup = schedule.scheduleJob('0 * * * *', async () => {
  console.log('开始执行定期清理任务...');
  try {
    const result = await privateChatModel.cleanupExpiredMessages();
    console.log('定期清理任务完成:', result);
  } catch (error) {
    console.error('定期清理任务失败:', error);
  }
});

// 每天深夜执行一次数据库工件清理（3:30 AM）
const databaseMaintenanceJob = schedule.scheduleJob('30 3 * * *', async () => {
  console.log('开始执行数据库维护任务...');
  try {
    const result = await privateChatModel.cleanupDatabaseArtifacts();
    console.log('数据库维护任务完成:', result);
  } catch (error) {
    console.error('数据库维护任务失败:', error);
  }
});

// 添加一个立即清理的API端点（仅管理员可用）
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    if (!req.user || !req.user.is_admin) {
      return res.status(403).json({ message: '无权访问' });
    }
    
    const result = await privateChatModel.cleanupExpiredMessages();
    return res.json({
      message: '立即清理完成',
      result
    });
  } catch (error) {
    console.error('手动清理失败:', error);
    return res.status(500).json({ message: '清理任务失败' });
  }
});

// 优雅关闭：取消定时任务
process.on('SIGTERM', () => {
  console.log('正在关闭应用...');
  if (scheduledCleanup) {
    scheduledCleanup.cancel();
    console.log('已取消定时清理任务');
  }
  if (databaseMaintenanceJob) {
    databaseMaintenanceJob.cancel();
    console.log('已取消数据库维护任务');
  }
  process.exit(0);
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error("服务器错误:", {
    error: err,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });

  res.status(500).json({
    message: "服务器错误",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404处理中间件 - 放在所有路由之后
app.use((req, res) => {
  console.log(`404错误: 未找到路由`, {
    url: req.url,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });
  res.status(404).json({ message: '未找到请求的资源' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log('已设置每小时清理过期消息');
});
