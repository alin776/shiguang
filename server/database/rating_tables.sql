-- 评分贴表
CREATE TABLE IF NOT EXISTS `rate_posts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL COMMENT '评分贴标题',
  `description` TEXT NULL COMMENT '评分贴描述',
  `category` VARCHAR(50) NOT NULL COMMENT '分类',
  `user_id` INT NOT NULL COMMENT '创建者ID',
  `total_ratings` INT DEFAULT 0 COMMENT '总评分人数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_rate_posts_category` (`category`),
  INDEX `idx_rate_posts_user_id` (`user_id`),
  CONSTRAINT `fk_rate_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评分贴表';

-- 评分选项表
CREATE TABLE IF NOT EXISTS `rate_options` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL COMMENT '评分贴ID',
  `name` VARCHAR(100) NOT NULL COMMENT '选项名称',
  `avatar` VARCHAR(255) NULL COMMENT '选项图片',
  `avg_score` DECIMAL(3,1) DEFAULT 0.0 COMMENT '平均分',
  `ratings_count` INT DEFAULT 0 COMMENT '评分人数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_rate_options_post_id` (`post_id`),
  CONSTRAINT `fk_rate_options_post` FOREIGN KEY (`post_id`) REFERENCES `rate_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评分选项表';

-- 用户评分记录表
CREATE TABLE IF NOT EXISTS `rate_ratings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `option_id` INT NOT NULL COMMENT '选项ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `score` INT NOT NULL COMMENT '评分',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unique_user_option` (`user_id`, `option_id`),
  INDEX `idx_rate_ratings_option_id` (`option_id`),
  INDEX `idx_rate_ratings_user_id` (`user_id`),
  CONSTRAINT `fk_rate_ratings_option` FOREIGN KEY (`option_id`) REFERENCES `rate_options` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rate_ratings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户评分记录表';

-- 评分评论表
CREATE TABLE IF NOT EXISTS `rate_comments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `option_id` INT NOT NULL COMMENT '选项ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `rating_id` INT NULL COMMENT '关联的评分ID',
  `likes` INT DEFAULT 0 COMMENT '点赞数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_rate_comments_option_id` (`option_id`),
  INDEX `idx_rate_comments_user_id` (`user_id`),
  INDEX `idx_rate_comments_rating_id` (`rating_id`),
  CONSTRAINT `fk_rate_comments_option` FOREIGN KEY (`option_id`) REFERENCES `rate_options` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rate_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rate_comments_rating` FOREIGN KEY (`rating_id`) REFERENCES `rate_ratings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评分评论表';

-- 评分评论点赞表
CREATE TABLE IF NOT EXISTS `rate_comment_likes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `comment_id` INT NOT NULL COMMENT '评论ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unique_user_comment` (`user_id`, `comment_id`),
  INDEX `idx_rate_comment_likes_comment_id` (`comment_id`),
  INDEX `idx_rate_comment_likes_user_id` (`user_id`),
  CONSTRAINT `fk_rate_comment_likes_comment` FOREIGN KEY (`comment_id`) REFERENCES `rate_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rate_comment_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评分评论点赞表'; 