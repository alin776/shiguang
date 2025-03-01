import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";

const API_BASE_URL = "http://47.98.210.7:3000";

export const useCheckInStore = defineStore("checkIn", {
  state: () => ({
    checkInItems: [],
    userCheckIns: [],
    loading: false,
    authStore: null,
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

    // 获取用户打卡记录
    async getUserCheckIns(year, month) {
      try {
        this.init();
        const response = await axios.get(`${API_BASE_URL}/api/checkins/user`, {
          params: { year, month },
          headers: { Authorization: `Bearer ${this.authStore.token}` },
        });
        this.userCheckIns = response.data;
        return response.data;
      } catch (error) {
        console.error("获取用户打卡记录失败:", error);
        throw error;
      }
    },
    
    // 获取今天的打卡记录 - 考虑时区问题
    async getTodayCheckIns() {
      try {
        this.init();
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        
        // 获取当月打卡记录
        const checkIns = await this.getUserCheckIns(year, month);
        
        // 获取东八区的今天日期
        const todayLocal = new Date().toLocaleDateString("zh-CN").replace(/\//g, "-");
        const yesterdayLocal = new Date(today.getTime() - 86400000).toLocaleDateString("zh-CN").replace(/\//g, "-");
        
        console.log("getTodayCheckIns - 本地今天日期:", todayLocal);
        console.log("getTodayCheckIns - 本地昨天日期:", yesterdayLocal);
        console.log("getTodayCheckIns - 所有打卡记录:", checkIns);
        
        // 修改比较逻辑，适应API返回的日期格式并考虑时区差异
        const todayCheckIns = checkIns.filter(checkIn => {
          // 将API日期转换为本地日期进行比较
          const date = new Date(checkIn.date);
          
          // 提取日期部分（东八区）
          const localDateStr = date.toLocaleDateString("zh-CN").replace(/\//g, "-");
          
          // 检查是否是昨天晚上但对应UTC已经是今天
          const isYesterday = localDateStr === yesterdayLocal;
          const utcHours = date.getUTCHours();
          const isYesterdayButUtcToday = isYesterday && utcHours >= 16; // UTC时间晚上8点后
          
          // 输出每条记录的日期比较详情
          console.log(`比较打卡记录: ${checkIn.item_id}, API日期: ${checkIn.date}`);
          console.log(`  本地日期: ${localDateStr}, UTC小时: ${utcHours}`);
          console.log(`  是今天: ${localDateStr === todayLocal}, 是昨天但UTC今天: ${isYesterdayButUtcToday}`);
          
          // 返回本地今天的打卡或因时区问题实际应计入今天的打卡
          return localDateStr === todayLocal || isYesterdayButUtcToday;
        });
        
        console.log("getTodayCheckIns - 考虑时区后的今日打卡记录:", todayCheckIns);
        
        return todayCheckIns;
      } catch (error) {
        console.error("获取今日打卡记录失败:", error);
        throw error;
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

        // 格式化日期
        let formattedDate;
        try {
          formattedDate = new Date(date).toISOString().split("T")[0];
        } catch (e) {
          // 如果日期解析失败，使用今天日期
          formattedDate = new Date().toISOString().split("T")[0];
        }

        // 检查是否已经打卡
        const today = new Date().toISOString().split("T")[0];
        if (formattedDate === today) {
          const todayCheckIns = await this.getUserCheckIns(
            new Date().getFullYear(),
            new Date().getMonth() + 1
          );

          const alreadyCheckedIn = todayCheckIns.some(
            (checkIn) => checkIn.item_id === intItemId && checkIn.date === today
          );

          if (alreadyCheckedIn) {
            // 自定义错误对象，但不实际发送请求
            const error = new Error("今日已打卡");
            error.isExpected = true; // 标记为预期错误
            throw error;
          }
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/checkins`,
          {
            itemId: intItemId,
            date: formattedDate,
          },
          { headers: { Authorization: `Bearer ${this.authStore.token}` } }
        );
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
        const formattedDate = new Date(date).toISOString().split("T")[0];
        const response = await axios.delete(`${API_BASE_URL}/api/checkins`, {
          params: { itemId, date: formattedDate },
          headers: { Authorization: `Bearer ${this.authStore.token}` },
        });
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
