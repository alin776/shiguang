/**
 * 更新控制器
 * 负责处理应用版本检查和更新相关功能
 */

const db = require('../config/database');

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
exports.checkForUpdates = async (req, res) => {
  try {
    const { version, buildNumber = '0' } = req.query;
    // 始终将平台设置为android
    const platform = 'android';
    
    // 验证必要参数
    if (!version) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数: version' 
      });
    }
    
    // 从数据库获取安卓平台的最新版本信息
    const [versions] = await db.execute(
      'SELECT * FROM app_versions WHERE platform = ? ORDER BY id DESC LIMIT 1',
      [platform]
    );
    
    if (!versions || versions.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到平台版本信息'
      });
    }
    
    // 获取最新版本
    const latestVersion = versions[0];
    
    // 比较版本号
    const versionComparison = compareVersions(latestVersion.version, version);
    
    // 如果有新版本
    if (versionComparison > 0) {
      return res.json({
        success: true,
        hasUpdate: true,
        latestVersion: latestVersion.version,
        currentVersion: version,
        forceUpdate: latestVersion.force_update === 1,
        releaseNotes: latestVersion.release_notes,
        releaseDate: latestVersion.release_date,
        downloadUrl: latestVersion.download_url
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
exports.getVersionHistory = async (req, res) => {
  try {
    // 固定使用android平台
    const platform = 'android';
    
    // 从数据库获取安卓平台的版本信息
    const [platformVersions] = await db.execute(
      'SELECT * FROM app_versions WHERE platform = ? ORDER BY id DESC',
      [platform]
    );
    
    if (!platformVersions || platformVersions.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到平台版本信息'
      });
    }
    
    // 处理数据库字段与API返回字段的映射
    const versions = platformVersions.map(version => ({
      version: version.version,
      buildNumber: version.build_number,
      releaseDate: version.release_date,
      forceUpdate: version.force_update === 1,
      releaseNotes: version.release_notes,
      downloadUrl: version.download_url
    }));
    
    // 返回版本历史记录
    return res.json({
      success: true,
      versions: versions
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

/**
 * 添加新版本
 * @param {object} req 请求对象
 * @param {object} res 响应对象
 */
exports.addVersion = async (req, res) => {
  try {
    const { 
      version, 
      buildNumber, 
      platform, 
      releaseNotes, 
      forceUpdate, 
      downloadUrl, 
      appStoreUrl, 
      minOsVersion 
    } = req.body;
    
    // 验证必要参数
    if (!version || !buildNumber || !platform || !releaseNotes) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数' 
      });
    }
    
    // 验证平台参数
    if (!['android', 'ios', 'web'].includes(platform.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: '平台参数无效，仅支持android、ios、web'
      });
    }
    
    // 检查版本是否已存在
    const [existingVersions] = await db.execute(
      'SELECT * FROM app_versions WHERE version = ? AND platform = ?',
      [version, platform.toLowerCase()]
    );
    
    if (existingVersions && existingVersions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `版本 ${version} 在 ${platform} 平台上已存在`
      });
    }
    
    // 拼接SQL语句和参数
    let sql = 'INSERT INTO app_versions (version, build_number, platform, release_notes, force_update';
    let values = [version, buildNumber, platform.toLowerCase(), releaseNotes, forceUpdate ? 1 : 0];
    let placeholders = '?, ?, ?, ?, ?';
    
    // 添加可选参数
    if (downloadUrl) {
      sql += ', download_url';
      values.push(downloadUrl);
      placeholders += ', ?';
    }
    
    if (appStoreUrl) {
      sql += ', app_store_url';
      values.push(appStoreUrl);
      placeholders += ', ?';
    }
    
    if (minOsVersion) {
      sql += ', min_os_version';
      values.push(minOsVersion);
      placeholders += ', ?';
    }
    
    // 完成SQL语句
    sql += `) VALUES (${placeholders})`;
    
    // 执行插入
    const [result] = await db.execute(sql, values);
    
    return res.status(201).json({
      success: true,
      message: `版本 ${version} 添加成功`,
      versionId: result.insertId
    });
  } catch (error) {
    console.error('添加版本失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取所有平台的最新版本
 * @param {object} req 请求对象
 * @param {object} res 响应对象
 */
exports.getLatestVersions = async (req, res) => {
  try {
    // 查询每个平台的最新版本
    const [versions] = await db.execute(`
      SELECT v.*
      FROM app_versions v
      INNER JOIN (
        SELECT platform, MAX(id) AS max_id
        FROM app_versions
        GROUP BY platform
      ) latest ON v.platform = latest.platform AND v.id = latest.max_id
    `);
    
    if (!versions || versions.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到版本信息'
      });
    }
    
    // 处理数据库字段与API返回字段的映射
    const latestVersions = versions.map(version => ({
      platform: version.platform,
      version: version.version,
      buildNumber: version.build_number,
      releaseDate: version.release_date,
      forceUpdate: version.force_update === 1,
      releaseNotes: version.release_notes,
      downloadUrl: version.download_url,
      appStoreUrl: version.app_store_url,
      minOsVersion: version.min_os_version
    }));
    
    return res.json({
      success: true,
      versions: latestVersions
    });
  } catch (error) {
    console.error('获取最新版本失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
}; 