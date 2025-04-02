// 从环境变量加载配置
require('dotenv').config();

// 导出配置对象
module.exports = {
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'time_management'
  },
  
  // JWT配置
  jwtSecret: process.env.JWT_SECRET || 'shigang-secret-key',
  jwtExpiration: '24h',
  
  // 服务器配置
  port: process.env.PORT || 3000,
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000'
}; 