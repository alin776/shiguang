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
const emailService = require("./services/emailService");

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
app.use("/api/users", userRoutes);
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

// 初始化邮件服务
emailService.initMailer();

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error("服务器错误:", {
    error: err,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  res.status(500).json({
    message: "服务器错误",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
