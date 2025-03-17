const nodemailer = require('nodemailer');
const config = require('../config/config');

// 创建邮件发送器
let transporter = null;

// 初始化邮件发送器配置
const initMailer = () => {
  // 打印邮箱配置信息（部分隐藏）
  const emailUser = process.env.EMAIL_USER || 'your-email@qq.com';
  const emailPass = process.env.EMAIL_PASS || 'your-auth-code';
  console.log('邮箱配置信息:');
  console.log(`- 邮箱: ${emailUser}`);
  console.log(`- 授权码: ${emailPass.substring(0, 2)}***${emailPass.substring(emailPass.length - 2)}`);
  
  // 详细配置QQ邮箱SMTP
  transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass
    },
    debug: true // 启用调试模式
  });
  
  // 验证邮件发送器配置
  transporter.verify((error) => {
    if (error) {
      console.error('邮件服务器连接失败:', error);
    } else {
      console.log('邮件服务器连接成功，已准备好发送邮件');
    }
  });
};

// 发送验证码邮件
const sendVerificationEmail = async (to, code) => {
  // 如果发送器未初始化，则初始化
  if (!transporter) {
    initMailer();
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@qq.com', // 发件人
    to: to,                              // 收件人
    subject: '时光 - 邮箱验证码',          // 邮件主题
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #3498db; text-align: center;">时光 - 邮箱验证</h2>
        <p>尊敬的用户：</p>
        <p>您好！感谢您注册时光应用。请使用以下验证码完成邮箱验证：</p>
        <div style="background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">
          ${code}
        </div>
        <p style="margin-top: 20px;">此验证码将在15分钟后失效，请尽快完成验证。</p>
        <p>如果这不是您本人的操作，请忽略此邮件。</p>
        <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
          此邮件由系统自动发送，请勿回复。<br>
          © ${new Date().getFullYear()} 时光应用 版权所有
        </p>
      </div>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    throw error;
  }
};

module.exports = {
  initMailer,
  sendVerificationEmail
}; 