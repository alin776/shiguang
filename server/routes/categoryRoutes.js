const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const auth = require("../middleware/auth");

// 原来需要管理员权限的路由，现在只需要用户登录
router.post("/", auth, categoryController.createCategory);
router.put("/:id", auth, categoryController.updateCategory);
router.delete("/:id", auth, categoryController.deleteCategory);

// 普通用户可访问的路由
router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategory);

module.exports = router; 