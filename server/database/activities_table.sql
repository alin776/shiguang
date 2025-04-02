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