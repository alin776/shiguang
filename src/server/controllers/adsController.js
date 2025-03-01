const { validationResult } = require("express-validator");
const db = require("../config/database");

exports.getAds = async (req, res) => {
  try {
    const { position } = req.query;
    let query = "SELECT * FROM ads WHERE 1=1";
    const params = [];

    if (position) {
      query += " AND position = ?";
      params.push(position);
    }

    query += " ORDER BY created_at DESC";
    const [ads] = await db.execute(query, params);

    res.json(ads);
  } catch (error) {
    console.error("获取广告列表错误:", error);
    res.status(500).json({ message: "获取广告列表失败" });
  }
};

exports.recordAdClick = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { adId } = req.body;
    const userId = req.userId || null;

    // 记录点击
    await db.execute("INSERT INTO ad_clicks (ad_id, user_id) VALUES (?, ?)", [
      adId,
      userId,
    ]);

    // 更新广告点击次数
    await db.execute("UPDATE ads SET clicks = clicks + 1 WHERE id = ?", [adId]);

    res.json({ message: "广告点击已记录" });
  } catch (error) {
    console.error("记录广告点击错误:", error);
    res.status(500).json({ message: "记录广告点击失败" });
  }
};

exports.addAd = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, position, link } = req.body;

    const [result] = await db.execute(
      `INSERT INTO ads (title, content, position, link) 
       VALUES (?, ?, ?, ?)`,
      [title, content, position, link]
    );

    res.status(201).json({
      message: "广告添加成功",
      adId: result.insertId,
    });
  } catch (error) {
    console.error("添加广告错误:", error);
    res.status(500).json({ message: "添加广告失败" });
  }
};
