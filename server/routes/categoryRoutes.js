const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

// 需要管理员权限的路由
router.post("/", auth, adminMiddleware, categoryController.createCategory);
router.put("/:id", auth, adminMiddleware, categoryController.updateCategory);
router.delete("/:id", auth, adminMiddleware, categoryController.deleteCategory);

// 普通用户可访问的路由
router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategory);

module.exports = router; 