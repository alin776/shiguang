/**
 * 更新控制器
 * 负责处理应用版本检查和更新相关功能
 */

// 存储应用版本信息的配置
const appVersions = {
  // Android版本信息
  android: [
    {
      version: '1.0.0',
      buildNumber: '1',
      releaseDate: '2024-03-17',
      forceUpdate: false,
      releaseNotes: '当前版本',
      downloadUrl: 'https://你的下载服务器地址/shiguang-1.0.0.apk',
      minOsVersion: '8.0.0'
    }
  ],
  
  // iOS版本信息
  ios: [
    {
      version: '1.0.0',
      buildNumber: '1',
      releaseDate: '2024-03-17',
      forceUpdate: false,
      releaseNotes: '当前版本',
      appStoreUrl: 'https://apps.apple.com/app/id你的APPID',
      minOsVersion: '13.0.0'
    }
  ],
  
  // Web版本信息
  web: [
    {
      version: '1.0.0',
      releaseDate: '2024-03-17',
      forceUpdate: false,
      releaseNotes: '当前版本'
    }
  ]
};

/**
 * 比较版本号
 * @param {string} v1 版本1
 * @param {string} v2 版本2
 * @returns {number} 如果v1>v2返回1，v1<v2返回-1，v1=v2返回0
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  
  return 0;
}

/**
 * 检查更新接口
 * @param {object} req 请求对象
 * @param {object} res 响应对象
 */
exports.checkForUpdates = (req, res) => {
  try {
    const { version, platform = 'web', buildNumber = '0' } = req.query;
    
    // 验证必要参数
    if (!version) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数: version' 
      });
    }
    
    // 获取对应平台的版本信息
    const platformVersions = appVersions[platform.toLowerCase()] || appVersions.web;
    
    if (!platformVersions || platformVersions.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到平台版本信息'
      });
    }
    
    // 获取最新版本
    const latestVersion = platformVersions[0];
    
    // 比较版本号
    const versionComparison = compareVersions(latestVersion.version, version);
    
    // 如果有新版本
    if (versionComparison > 0) {
      return res.json({
        success: true,
        hasUpdate: true,
        latestVersion: latestVersion.version,
        currentVersion: version,
        forceUpdate: latestVersion.forceUpdate || false,
        releaseNotes: latestVersion.releaseNotes,
        releaseDate: latestVersion.releaseDate,
        // 根据平台提供不同的下载信息
        ...(platform === 'android' ? { downloadUrl: latestVersion.downloadUrl } : {}),
        ...(platform === 'ios' ? { appStoreUrl: latestVersion.appStoreUrl } : {})
      });
    }
    
    // 没有更新
    return res.json({
      success: true,
      hasUpdate: false,
      currentVersion: version,
      latestVersion: latestVersion.version
    });
  } catch (error) {
    console.error('检查更新失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取所有版本历史记录
 * @param {object} req 请求对象
 * @param {object} res 响应对象
 */
exports.getVersionHistory = (req, res) => {
  try {
    const { platform = 'web' } = req.query;
    
    // 获取对应平台的版本信息
    const platformVersions = appVersions[platform.toLowerCase()] || appVersions.web;
    
    if (!platformVersions || platformVersions.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到平台版本信息'
      });
    }
    
    // 返回版本历史记录
    return res.json({
      success: true,
      versions: platformVersions
    });
  } catch (error) {
    console.error('获取版本历史失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
}; 