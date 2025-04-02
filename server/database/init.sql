-- 创建评分贴分类表
CREATE TABLE IF NOT EXISTS `rate_post_categories` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认评分贴分类
INSERT INTO `rate_post_categories` (`id`, `name`, `description`, `display_order`, `is_active`) VALUES
('movie', '电影', '电影相关的评分贴', 1, 1),
('game', '游戏', '游戏相关的评分贴', 2, 1),
('platform', '平台', '平台相关的评分贴', 3, 1),
('brand', '品牌', '品牌相关的评分贴', 4, 1),
('other', '其他', '其他类型的评分贴', 5, 1)
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP; 