const { validationResult } = require("express-validator");
const Activity = require("../models/activity");
const dayjs = require("dayjs");

// 获取活动列表
exports.getActivities = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const activities = await Activity.findAll(parseInt(limit), parseInt(offset));
    
    res.json({ 
      message: "获取活动列表成功",
      data: activities 
    });
  } catch (error) {
    console.error("获取活动列表失败:", error);
    res.status(500).json({ message: "获取活动列表失败" });
  }
};

// 获取活动详情
exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findById(id);
    
    if (!activity) {
      return res.status(404).json({ message: "活动不存在" });
    }
    
    res.json({ 
      message: "获取活动详情成功",
      data: activity 
    });
  } catch (error) {
    console.error("获取活动详情失败:", error);
    res.status(500).json({ message: "获取活动详情失败" });
  }
};

// 创建活动
exports.createActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { 
      title, 
      description, 
      coverImage, 
      startTime, 
      endTime, 
      location, 
      maxParticipants, 
      status 
    } = req.body;

    // 验证时间
    if (dayjs(endTime).isBefore(dayjs(startTime))) {
      return res.status(400).json({ message: "结束时间不能早于开始时间" });
    }

    const activityData = {
      title,
      description,
      coverImage,
      startTime,
      endTime,
      location,
      maxParticipants: parseInt(maxParticipants) || 100,
      status: status || 'active',
      createdBy: userId
    };

    const activityId = await Activity.create(activityData);
    
    const createdActivity = await Activity.findById(activityId);
    
    res.status(201).json({ 
      message: "创建活动成功",
      data: createdActivity 
    });
  } catch (error) {
    console.error("创建活动失败:", error);
    res.status(500).json({ message: "创建活动失败" });
  }
};

// 更新活动
exports.updateActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { 
      title, 
      description, 
      coverImage, 
      startTime, 
      endTime, 
      location, 
      maxParticipants, 
      status 
    } = req.body;

    // 验证时间
    if (dayjs(endTime).isBefore(dayjs(startTime))) {
      return res.status(400).json({ message: "结束时间不能早于开始时间" });
    }

    const activityData = {
      title,
      description,
      coverImage,
      startTime,
      endTime,
      location,
      maxParticipants: parseInt(maxParticipants) || 100,
      status
    };

    const success = await Activity.update(id, activityData);
    
    if (!success) {
      return res.status(404).json({ message: "活动不存在或更新失败" });
    }
    
    const updatedActivity = await Activity.findById(id);
    
    res.json({ 
      message: "更新活动成功",
      data: updatedActivity 
    });
  } catch (error) {
    console.error("更新活动失败:", error);
    res.status(500).json({ message: "更新活动失败" });
  }
};

// 删除活动
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await Activity.delete(id);
    
    if (!success) {
      return res.status(404).json({ message: "活动不存在或删除失败" });
    }
    
    res.json({ message: "删除活动成功" });
  } catch (error) {
    console.error("删除活动失败:", error);
    res.status(500).json({ message: "删除活动失败" });
  }
};

// 参加活动
exports.joinActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await Activity.joinActivity(id, userId);
    
    res.json({ message: "参加活动成功" });
  } catch (error) {
    console.error("参加活动失败:", error);
    res.status(400).json({ message: error.message || "参加活动失败" });
  }
};

// 退出活动
exports.leaveActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await Activity.leaveActivity(id, userId);
    
    res.json({ message: "退出活动成功" });
  } catch (error) {
    console.error("退出活动失败:", error);
    res.status(400).json({ message: error.message || "退出活动失败" });
  }
};

// 获取用户参加的活动
exports.getUserActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;
    
    const activities = await Activity.getUserActivities(
      userId, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({ 
      message: "获取用户活动列表成功",
      data: activities 
    });
  } catch (error) {
    console.error("获取用户活动列表失败:", error);
    res.status(500).json({ message: "获取用户活动列表失败" });
  }
}; 