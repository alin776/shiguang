const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('正在测试管理员登录API...');
    
    const response = await axios.post('http://47.98.210.7:3000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API响应状态码:', response.status);
    console.log('API响应数据:', response.data);
    console.log('测试完成!');
  } catch (error) {
    console.error('测试过程中发生错误:');
    if (error.response) {
      // 服务器返回了错误响应
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      // 请求发送了但没有收到响应
      console.error('没有收到响应，请检查服务器是否正在运行');
    } else {
      // 请求设置过程中出现问题
      console.error('请求出错:', error.message);
    }
  }
}

// 运行测试
testAdminLogin(); 