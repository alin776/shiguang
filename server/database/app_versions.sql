-- 创建应用版本管理表
CREATE TABLE IF NOT EXISTS `app_versions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `version` VARCHAR(20) NOT NULL,
  `build_number` VARCHAR(20) NOT NULL,
  `platform` ENUM('android', 'ios', 'web') NOT NULL,
  `release_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `force_update` BOOLEAN DEFAULT FALSE,
  `release_notes` TEXT NOT NULL,
  `download_url` VARCHAR(255) DEFAULT NULL,
  `app_store_url` VARCHAR(255) DEFAULT NULL,
  `min_os_version` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_platform_version` (`platform`, `version`),
  UNIQUE KEY `unique_platform_version` (`platform`, `version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化版本数据
INSERT INTO `app_versions` 
  (`version`, `build_number`, `platform`, `release_date`, `force_update`, `release_notes`, `download_url`, `min_os_version`) 
VALUES 
  ('1.0.0', '1', 'android', '2024-03-17', FALSE, '当前版本', 'https://你的下载服务器地址/shiguang-1.0.0.apk', '8.0.0');

INSERT INTO `app_versions` 
  (`version`, `build_number`, `platform`, `release_date`, `force_update`, `release_notes`, `app_store_url`, `min_os_version`) 
VALUES 
  ('1.0.0', '1', 'ios', '2024-03-17', FALSE, '当前版本', 'https://apps.apple.com/app/id你的APPID', '13.0.0');

INSERT INTO `app_versions` 
  (`version`, `build_number`, `platform`, `release_date`, `force_update`, `release_notes`) 
VALUES 
  ('1.0.0', '1', 'web', '2024-03-17', FALSE, '当前版本'); 