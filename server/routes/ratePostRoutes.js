const express = require('express');
const router = express.Router();
const ratePostController = require('../controllers/ratePostController');
const authenticate = require('../middleware/auth');

/**
 * @swagger
 * /api/rate-posts:
 *   get:
 *     summary: 获取评分贴列表
 *     description: 根据分类获取评分贴列表
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 评分贴分类，默认为'all'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码，默认为1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 每页数量，默认为10
 *     responses:
 *       200:
 *         description: 返回评分贴列表
 */
router.get('/', authenticate, ratePostController.getRatePosts);

/**
 * @swagger
 * /api/rate-posts:
 *   post:
 *     summary: 创建评分贴
 *     description: 创建新的评分贴
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     avatar:
 *                       type: string
 *     responses:
 *       200:
 *         description: 评分贴创建成功
 *       400:
 *         description: 参数错误
 */
router.post('/', authenticate, ratePostController.createRatePost);

/**
 * @swagger
 * /api/rate-posts/rating:
 *   post:
 *     summary: 添加评分
 *     description: 为选项添加评分
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               optionId:
 *                 type: integer
 *               score:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 评分成功
 *       400:
 *         description: 参数错误
 */
router.post('/rating', authenticate, ratePostController.addRating);

/**
 * @swagger
 * /api/rate-posts/comment:
 *   post:
 *     summary: 添加评论
 *     description: 为选项添加评论
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               optionId:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 评论成功
 *       400:
 *         description: 参数错误
 */
router.post('/comment', authenticate, ratePostController.addComment);

/**
 * @swagger
 * /api/rate-posts/comment/{commentId}/like:
 *   post:
 *     summary: 点赞评论
 *     description: 点赞或取消点赞评论
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 评论ID
 *     responses:
 *       200:
 *         description: 点赞/取消点赞成功
 *       400:
 *         description: 参数错误
 */
router.post('/comment/:commentId/like', authenticate, ratePostController.likeComment);

/**
 * @swagger
 * /api/rate-posts/{id}:
 *   get:
 *     summary: 获取评分贴详情
 *     description: 根据ID获取评分贴详情
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 评分贴ID
 *     responses:
 *       200:
 *         description: 返回评分贴详情
 *       404:
 *         description: 评分贴不存在
 */
router.get('/:id', authenticate, ratePostController.getRatePostDetail);

/**
 * @swagger
 * /api/rate-posts/option/{optionId}/check-rated:
 *   get:
 *     summary: 检查用户是否已对选项评分
 *     description: 检查当前用户是否已对指定选项进行过评分
 *     parameters:
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 选项ID
 *     responses:
 *       200:
 *         description: 返回评分状态
 *       400:
 *         description: 参数错误
 *       404:
 *         description: 选项不存在
 */
router.get('/option/:optionId/check-rated', authenticate, ratePostController.checkRatedStatus);

module.exports = router; 