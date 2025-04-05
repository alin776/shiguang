-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  cover_image VARCHAR(255),
  bio TEXT,
  experience INT DEFAULT 0,
  level INT DEFAULT 1,
  points INT DEFAULT 0,
  title VARCHAR(50) DEFAULT NULL,
  post_streak INT DEFAULT 0,
  last_post_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('online', 'offline') DEFAULT 'offline',
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  role ENUM('super_admin', 'admin', 'editor') DEFAULT 'admin',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 事件表
CREATE TABLE IF NOT EXISTS events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  color VARCHAR(20),
  reminder BOOLEAN DEFAULT false,
  reminder_time DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 帖子表
CREATE TABLE IF NOT EXISTS posts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  images TEXT,
  views INT UNSIGNED DEFAULT 0,
  likes INT UNSIGNED DEFAULT 0,
  audio VARCHAR(255) DEFAULT NULL,
  category_id INT UNSIGNED,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_pinned BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  audio VARCHAR(255) DEFAULT NULL,
  images JSON DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 点赞表
CREATE TABLE IF NOT EXISTS likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (post_id, user_id)
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('like', 'comment', 'reply', 'follow', 'system') NOT NULL,
  content TEXT NOT NULL,
  source_id INT,  -- 来源ID(帖子ID、评论ID等)
  source_type VARCHAR(50), -- 来源类型(post、comment等)
  actor_id INT,   -- 触发者ID
  related_id INT, -- 关联ID(具体评论ID、回复ID等)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 为通知表添加索引
CREATE INDEX idx_user_notifications ON notifications(user_id, is_read);

-- 关注关系表
CREATE TABLE IF NOT EXISTS follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,
  followed_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, followed_id)
);

-- 为关注表添加索引
CREATE INDEX idx_follower ON follows(follower_id);
CREATE INDEX idx_followed ON follows(followed_id);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  notification_settings JSON DEFAULT NULL,
  theme_settings JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 反馈表
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  contact VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'replied') DEFAULT 'pending',
  reply TEXT,
  reply_time TIMESTAMP NULL,
  reply_by INT,
  FOREIGN KEY (reply_by) REFERENCES users(id)
);
-- 创建活动表
CREATE TABLE IF NOT EXISTS `activities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL COMMENT '活动标题',
  `description` TEXT NOT NULL COMMENT '活动描述',
  `cover_image` VARCHAR(255) NULL COMMENT '封面图片URL',
  `start_time` DATETIME NOT NULL COMMENT '活动开始时间',
  `end_time` DATETIME NOT NULL COMMENT '活动结束时间',
  `location` VARCHAR(100) NOT NULL COMMENT '活动地点',
  `max_participants` INT NOT NULL DEFAULT 100 COMMENT '最大参与人数',
  `current_participants` INT NOT NULL DEFAULT 0 COMMENT '当前参与人数',
  `status` ENUM('active', 'cancelled', 'completed') NOT NULL DEFAULT 'active' COMMENT '活动状态',
  `created_by` INT NULL COMMENT '创建者ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_activity_status` (`status`),
  INDEX `idx_activity_start_time` (`start_time`),
  INDEX `idx_activity_end_time` (`end_time`),
  INDEX `idx_activity_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';

-- 创建活动参与表
CREATE TABLE IF NOT EXISTS `activity_participants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `activity_id` INT NOT NULL COMMENT '活动ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '参加时间',
  `status` ENUM('joined', 'cancelled') NOT NULL DEFAULT 'joined' COMMENT '参与状态',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_activity_user` (`activity_id`, `user_id`),
  INDEX `idx_user_activities` (`user_id`),
  CONSTRAINT `fk_activity_participants_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activity_participants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动参与表'; 
-- 评论点赞表
CREATE TABLE IF NOT EXISTS comment_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  comment_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_comment_like (comment_id, user_id)
);

-- 评论回复表
CREATE TABLE IF NOT EXISTS comment_replies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  comment_id INT NOT NULL,
  user_id INT NOT NULL,
  reply_to_id INT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 打卡项目表
CREATE TABLE IF NOT EXISTS `checkin_items` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `color` VARCHAR(20) DEFAULT '#409EFF',
  `enabled` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 打卡记录表
CREATE TABLE IF NOT EXISTS `checkins` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_item_date` (`user_id`, `item_id`, `date`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `checkin_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 小记表
CREATE TABLE IF NOT EXISTS `notes` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `content` TEXT NOT NULL,
  `author_id` INT NOT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `likes` INT DEFAULT 0,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_notes_created_at` (`created_at`),  
  INDEX `idx_notes_author` (`author_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 小记点赞表
CREATE TABLE IF NOT EXISTS `note_likes` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `note_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_note_like` (`note_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 分类表
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 任务记录表
CREATE TABLE IF NOT EXISTS `user_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `task_type` VARCHAR(50) NOT NULL,
  `progress` INT NOT NULL DEFAULT 0,
  `target` INT NOT NULL,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `user_task_day` (`user_id`, `task_type`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 经验值历史记录表
CREATE TABLE IF NOT EXISTS `user_exp_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `exp_gained` INT NOT NULL,
  `source` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 积分历史记录表
CREATE TABLE IF NOT EXISTS `user_points_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `points_gained` INT NOT NULL,
  `source` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户表情包表
CREATE TABLE IF NOT EXISTS `user_emojis` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `name` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_user_emojis` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- 任务定义表
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_type` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(100) NOT NULL,
  `description` VARCHAR(200) NOT NULL,
  `target` INT NOT NULL,
  `reward` INT NOT NULL,
  `points_reward` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入默认任务
INSERT INTO `tasks` (`task_type`, `title`, `description`, `target`, `reward`, `points_reward`, `is_active`) VALUES
('post', '发布帖子', '在社区发布1篇帖子(额外奖励,每次发帖直接获得10经验)', 1, 10, 5, 1),
('comment', '评论互动', '在社区评论3次(额外奖励,每次评论直接获得5经验)', 3, 5, 2, 1),
('like', '点赞支持', '给帖子点赞5次(额外奖励,每次点赞直接获得2经验)', 5, 10, 3, 1);

-- 每日经验上限配置表
CREATE TABLE IF NOT EXISTS `system_settings` (
  `key` VARCHAR(50) PRIMARY KEY,
  `value` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入经验上限配置
INSERT INTO `system_settings` (`key`, `value`, `description`) VALUES
('daily_exp_limit', '50', '用户每日可获取的最大经验值'); 
-- 添加分类关联到帖子表
ALTER TABLE posts ADD COLUMN category_id INT DEFAULT NULL;
ALTER TABLE posts ADD FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- 举报表
CREATE TABLE IF NOT EXISTS `reports` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `reporter_id` INT NOT NULL,
  `reported_type` ENUM('post', 'comment') NOT NULL,
  `reported_id` INT NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending', 'processed', 'dismissed') DEFAULT 'pending',
  `processed_by` INT DEFAULT NULL,
  `processed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`processed_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 公告表
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `author_id` INT UNSIGNED NOT NULL,
  `images` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_author_id` (`author_id`),
  CONSTRAINT `fk_announcements_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 修改通知表，添加类型字段和来源关联
ALTER TABLE `notifications` 
ADD COLUMN `type` ENUM('like', 'comment', 'system') NOT NULL DEFAULT 'comment' AFTER `is_read`,
ADD COLUMN `source_type` VARCHAR(50) NULL AFTER `type`,
ADD COLUMN `source_id` INT UNSIGNED NULL AFTER `source_type`;
-- 先删除从表（有外键约束的表）
DROP TABLE IF EXISTS `chat_likes`;
-- 然后删除主表
DROP TABLE IF EXISTS `chat_messages`;
-- 删除评论表
DROP TABLE IF EXISTS `chat_comments`;
-- 删除评论点赞表
DROP TABLE IF EXISTS `chat_comment_likes`;
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
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 添加用户称号相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS post_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_post_date DATE DEFAULT NULL; 
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

-- 积分商品表
CREATE TABLE IF NOT EXISTS `points_products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL COMMENT '商品名称',
  `description` TEXT COMMENT '商品描述',
  `image_url` VARCHAR(255) COMMENT '商品图片',
  `points_cost` INT NOT NULL COMMENT '所需积分',
  `quantity` INT NOT NULL DEFAULT 0 COMMENT '库存数量',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否上架',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 积分兑换记录表
CREATE TABLE IF NOT EXISTS `points_exchanges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `points_cost` INT NOT NULL COMMENT '兑换时的积分花费',
  `status` ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending' COMMENT '兑换状态',
  `exchange_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '兑换时间',
  `completion_time` TIMESTAMP NULL COMMENT '完成时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `points_products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 卡片游戏结果表
CREATE TABLE IF NOT EXISTS `card_game_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `winning_position` tinyint(4) NOT NULL COMMENT '获胜位置（0-2）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卡片游戏结果记录';

-- 卡片游戏投注表
CREATE TABLE IF NOT EXISTS `card_game_bets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `selected_position` tinyint(4) NOT NULL COMMENT '选择的位置（0-2）',
  `bet_amount` int(11) NOT NULL COMMENT '投注金额',
  `result_id` int(11) DEFAULT NULL COMMENT '关联的结果ID',
  `is_win` tinyint(1) DEFAULT NULL COMMENT '是否获胜',
  `reward` int(11) DEFAULT NULL COMMENT '奖励金额',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_card_game_bets_user` (`user_id`),
  KEY `fk_card_game_bets_result` (`result_id`),
  CONSTRAINT `fk_card_game_bets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_card_game_bets_result` FOREIGN KEY (`result_id`) REFERENCES `card_game_results` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卡片游戏投注记录';

-- 私聊会话表
CREATE TABLE IF NOT EXISTS `private_chats` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_message_preview` VARCHAR(100) NULL,
  `is_ephemeral` BOOLEAN DEFAULT FALSE COMMENT '是否为无痕对话'
);

-- 私聊会话成员表
CREATE TABLE IF NOT EXISTS `private_chat_members` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `chat_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_read_at` TIMESTAMP NULL,
  FOREIGN KEY (`chat_id`) REFERENCES `private_chats` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_chat_user` (`chat_id`, `user_id`)
);

-- 无痕消息表
CREATE TABLE IF NOT EXISTS `ephemeral_messages` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `chat_id` INT NOT NULL,
  `sender_id` INT NOT NULL,
  `content` TEXT NULL,
  `content_type` ENUM('text', 'image', 'audio', 'video', 'file') DEFAULT 'text',
  `media_url` VARCHAR(255) NULL,
  `encryption_key` VARCHAR(255) NOT NULL COMMENT '端到端加密密钥',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expire_after` INT UNSIGNED NULL COMMENT '消息有效期(秒)',
  `expire_after_read` BOOLEAN DEFAULT FALSE COMMENT '是否阅后即焚',
  `is_read` BOOLEAN DEFAULT FALSE,
  `read_at` TIMESTAMP NULL,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (`chat_id`) REFERENCES `private_chats` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- 消息阅读状态表
CREATE TABLE IF NOT EXISTS `ephemeral_message_reads` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `message_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `will_delete_at` TIMESTAMP NULL COMMENT '预计删除时间',
  FOREIGN KEY (`message_id`) REFERENCES `ephemeral_messages` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
); 
 CREATE TABLE IF NOT EXISTS pinned_chats (
        id INT NOT NULL AUTO_INCREMENT,
        chat_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_pin (chat_id, user_id),
        FOREIGN KEY (chat_id) REFERENCES private_chats(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );