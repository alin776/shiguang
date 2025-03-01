import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";

const API_BASE_URL = "http://47.98.210.7:3000";

// 格式化日期为YYYY-MM-DD，考虑本地时区
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useCheckInStore = defineStore("checkIn", {
  state: () => ({
    checkInItems: [],
    userCheckIns: [],
    loading: false,
    authStore: null,
    completedItemIds: [], // 新增状态，记录已完成打卡的项目ID
  }),

  actions: {
    // 初始化 authStore
    init() {
      if (!this.authStore) {
        this.authStore = useAuthStore();
      }
    },

    // 获取打卡项目列表
    async getCheckInItems() {
      try {
        this.init();
        this.loading = true;
        const response = await axios.get(`${API_BASE_URL}/api/checkins/items`, {
          headers: { Authorization: `Bearer ${this.authStore.token}` },
        });
        this.checkInItems = response.data;
        return response.data;
      } catch (error) {
        console.error("获取打卡项目失败:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 获取用户指定年月的打卡记录
    async getUserCheckIns(year, month) {
      try {
        this.init();
        
        // 确保年月参数有效
        if (!year || !month) {
          const now = new Date();
          year = year || now.getFullYear();
          month = month || now.getMonth() + 1;
        }
        
        console.log(`获取用户${year}年${month}月的打卡记录`);
        
        // 添加时间戳避免缓存
        const response = await axios.get(
          `${API_BASE_URL}/api/checkins/user`, 
          {
            params: {
              year,
              month,
              _t: new Date().getTime()
            },
            headers: { Authorization: `Bearer ${this.authStore.token}` }
          }
        );
        
        if (!response.data || !Array.isArray(response.data)) {
          console.warn("获取用户打卡记录: 返回数据格式不正确", response.data);
          return [];
        }
        
        console.log(`成功获取${response.data.length}条${year}年${month}月的打卡记录`);
        return response.data;
      } catch (error) {
        console.error("获取用户打卡记录失败:", error);
        if (error.response) {
          console.error("服务器错误详情:", error.response.data);
        }
        // 返回空数组而不是抛出错误，避免界面崩溃
        return [];
      }
    },
    
    // 获取今日的打卡记录
    async getTodayCheckIns() {
      try {
        this.init();
        this.loading = true;
        
        // 获取当前日期（本地时区）
        const today = new Date();
        const formattedDate = formatLocalDate(today);
        
        console.log(`获取今日(${formattedDate})打卡记录...`);
        
        // 获取当月的所有打卡记录
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const checkIns = await this.getUserCheckIns(year, month);
        
        console.log("当月所有打卡记录:", checkIns);
        
        // 在客户端筛选今天的打卡记录
        const todayCheckIns = checkIns.filter(checkIn => {
          // 将API日期转换为本地格式进行比较
          const checkInDate = new Date(checkIn.date);
          const checkInDateFormatted = formatLocalDate(checkInDate);
          
          // 记录详细信息用于调试
          console.log(`比较打卡记录: 项目ID:${checkIn.item_id}, API日期:${checkIn.date}, 格式化日期:${checkInDateFormatted}`);
          console.log(`  与今天日期匹配: ${checkInDateFormatted === formattedDate}`);
          
          // 返回今天的打卡记录
          return checkInDateFormatted === formattedDate;
        });
        
        console.log("今日打卡记录:", todayCheckIns);
        
        // 更新今日已完成打卡的项目ID列表
        this.completedItemIds = todayCheckIns.map(checkIn => parseInt(checkIn.item_id));
        console.log("更新已完成打卡项目ID列表:", this.completedItemIds);
        
        // 返回今日打卡记录
        return todayCheckIns;
      } catch (error) {
        console.error("获取今日打卡记录失败:", error);
        return [];
      } finally {
        this.loading = false;
      }
    },

    // 打卡
    async checkIn(itemId, date = new Date()) {
      try {
        this.init();
        // 确保 itemId 是整数
        const intItemId = parseInt(itemId);
        if (isNaN(intItemId)) {
          throw new Error("无效的项目ID");
        }

        // 使用当天本地时间（考虑时区）
        const now = new Date();
        // 格式化为YYYY-MM-DD格式，使用本地时区
        const formattedDate = formatLocalDate(now);
        
        console.log("== 打卡操作信息 ==");
        console.log(`本地当前时间: ${now.toLocaleString('zh-CN')}`);
        console.log(`使用当天日期(本地时区): ${formattedDate}`);
        console.log(`尝试打卡: 项目ID:${intItemId}`);
        
        // 获取最新的打卡记录，确保前端状态与后端同步
        const todayCheckIns = await this.getTodayCheckIns();
        console.log(`获取到的今日打卡记录:`, todayCheckIns);
        
        // 检查该项目是否已经完成打卡
        if (this.completedItemIds.includes(intItemId)) {
          console.log(`项目 ${intItemId} 今日已打卡，不再重复请求`);
          
          // 自定义错误对象，但不实际发送请求
          const error = new Error("今日已打卡");
          error.isExpected = true; // 标记为预期错误
          throw error;
        }

        // 发送打卡请求
        console.log(`向服务器发送打卡请求:`, {
          itemId: intItemId,
          date: formattedDate,
        });
        
        const response = await axios.post(
          `${API_BASE_URL}/api/checkins`,
          {
            itemId: intItemId,
            date: formattedDate,
          },
          { headers: { Authorization: `Bearer ${this.authStore.token}` } }
        );
        
        console.log("打卡成功响应:", response.data);
        
        // 打卡成功后立即刷新数据
        await this.getTodayCheckIns();
        
        // 记录已完成打卡的项目ID
        this.completedItemIds.push(intItemId);
        
        return response.data;
      } catch (error) {
        // 更详细的错误信息
        if (error.isExpected) {
          // 处理预期的错误，如已经打卡
          console.info("操作信息:", error.message);
          const customError = new Error(error.message);
          customError.isExpected = true;
          throw customError;
        } else if (error.response) {
          console.error("服务器响应错误:", error.response.data);
          // 特殊处理"今日已打卡"错误
          if (error.response.data.message === "今日已打卡") {
            const customError = new Error("今日已打卡");
            customError.isExpected = true;
            throw customError;
          }
        }
        console.error("打卡失败:", error);
        throw error;
      }
    },

    // 取消打卡
    async cancelCheckIn(itemId, date = new Date()) {
      try {
        this.init();
        // 确保 itemId 是整数
        const intItemId = parseInt(itemId);
        if (isNaN(intItemId)) {
          throw new Error("无效的项目ID");
        }

        // 使用本地时区的当天日期
        const formattedDate = formatLocalDate(date);
        
        console.log(`取消打卡操作: 项目ID:${intItemId}, 日期:${formattedDate}`);
        
        // 发送取消打卡请求 - 使用params方式传参
        const response = await axios.delete(`${API_BASE_URL}/api/checkins`, {
          params: { 
            itemId: intItemId, 
            date: formattedDate,
            _t: new Date().getTime() // 添加时间戳避免缓存
          },
          headers: { Authorization: `Bearer ${this.authStore.token}` },
        });
        
        console.log("取消打卡成功:", response.data);
        
        // 取消打卡后立即刷新数据
        await this.getTodayCheckIns();
        
        // 从已完成列表中移除
        const index = this.completedItemIds.indexOf(intItemId);
        if (index !== -1) {
          this.completedItemIds.splice(index, 1);
        }
        
        return response.data;
      } catch (error) {
        console.error("取消打卡失败:", error);
        throw error;
      }
    },

    // 创建新的打卡项目
    async createCheckInItem(name, color) {
      try {
        this.init();
        const response = await axios.post(
          `${API_BASE_URL}/api/checkins/items`,
          { name, color },
          { headers: { Authorization: `Bearer ${this.authStore.token}` } }
        );
        return response.data;
      } catch (error) {
        console.error("创建打卡项目失败:", error);
        throw error;
      }
    },

    // 更新打卡项目
    async updateCheckInItem(id, data) {
      try {
        this.init();
        const response = await axios.put(
          `${API_BASE_URL}/api/checkins/items/${id}`,
          data,
          { headers: { Authorization: `Bearer ${this.authStore.token}` } }
        );
        return response.data;
      } catch (error) {
        console.error("更新打卡项目失败:", error);
        throw error;
      }
    },

    // 获取用户打卡连续天数
    async getStreakData() {
      try {
        this.init();
        const response = await axios.get(
          `${API_BASE_URL}/api/checkins/streaks`,
          {
            headers: { Authorization: `Bearer ${this.authStore.token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error("获取连续打卡天数失败:", error);
        return [];
      }
    },

    // 删除打卡项目
    async deleteCheckInItem(id) {
      try {
        this.init();
        console.log("执行删除打卡项目，ID:", id);
        if (!id) {
          throw new Error("需要提供有效的打卡项目ID");
        }

        const response = await axios.delete(
          `${API_BASE_URL}/api/checkins/items/${id}`,
          { headers: { Authorization: `Bearer ${this.authStore.token}` } }
        );
        console.log("删除成功，服务器响应:", response.data);
        return response.data;
      } catch (error) {
        console.error("删除打卡项目失败详情:", error.message, error.stack);
        console.error("删除打卡项目失败:", error);
        throw error;
      }
    },
  },
});
