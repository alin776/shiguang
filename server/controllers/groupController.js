const { validationResult } = require("express-validator");
const db = require("../config/database");

exports.joinGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groupId } = req.body;

    // 检查群是否存在
    const [groups] = await db.execute(
      "SELECT * FROM official_groups WHERE id = ?",
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({ message: "群组不存在" });
    }

    // 检查用户是否已经在群中
    const [members] = await db.execute(
      "SELECT * FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, req.userId]
    );

    if (members.length > 0) {
      return res.status(400).json({ message: "已经是群成员" });
    }

    // 添加用户到群
    await db.execute(
      "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
      [groupId, req.userId]
    );

    res.json({ message: "成功加入群组" });
  } catch (error) {
    console.error("加入群组错误:", error);
    res.status(500).json({ message: "加入群组失败" });
  }
};

exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;

    const [members] = await db.execute(
      `SELECT u.id, u.username, u.email, gm.joined_at 
       FROM group_members gm 
       JOIN users u ON gm.user_id = u.id 
       WHERE gm.group_id = ? 
       ORDER BY gm.joined_at DESC`,
      [groupId]
    );

    res.json(members);
  } catch (error) {
    console.error("获取群成员错误:", error);
    res.status(500).json({ message: "获取群成员失败" });
  }
};

exports.getUserGroups = async (req, res) => {
  try {
    const [groups] = await db.execute(
      `SELECT g.*, gm.joined_at 
       FROM official_groups g 
       JOIN group_members gm ON g.id = gm.group_id 
       WHERE gm.user_id = ? 
       ORDER BY gm.joined_at DESC`,
      [req.userId]
    );

    res.json(groups);
  } catch (error) {
    console.error("获取用户群组错误:", error);
    res.status(500).json({ message: "获取用户群组失败" });
  }
};
