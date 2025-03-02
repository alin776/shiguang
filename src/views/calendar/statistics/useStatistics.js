import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { useCheckInStore } from "../../../stores/checkIn";
import { useAuthStore } from "../../../stores/auth";

export function useStatistics() {
  const router = useRouter();
  const checkInStore = useCheckInStore();
  const authStore = useAuthStore();

  const loading = ref(true);
  const selectedPeriod = ref("week");
  const showComparison = ref(true); // 设置为默认选中

  // 数据变量
  const checkInItems = ref([]);
  const allCheckIns = ref([]);
  const completionRate = ref("0.0");
  const previousCompletionRate = ref("0.0");
  const itemsCompletionData = ref([]);
  const previousItemsCompletionData = ref([]);
  const dailyCompletionData = ref([]);
  const previousDailyCompletionData = ref([]);
  const streakData = ref([]);

  // 计算时间范围并获取打卡数据
  const calculateDateRange = (period) => {
    const endDate = dayjs();
    let startDate;

    switch (period) {
      case "week":
        // 使用本周一到今天，而不是固定7天
        if (endDate.day() === 0) {
          // 周日
          startDate = endDate.subtract(6, "day");
        } else {
          startDate = endDate.startOf("week").add(1, "day"); // 周一
        }
        break;
      case "month":
        startDate = endDate.subtract(29, "day");
        break;
      case "year":
        startDate = endDate.subtract(364, "day");
        break;
      default:
        // 使用本周一到今天，而不是固定7天
        if (endDate.day() === 0) {
          // 周日
          startDate = endDate.subtract(6, "day");
        } else {
          startDate = endDate.startOf("week").add(1, "day"); // 周一
        }
    }

    return {
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
    };
  };

  // 加载打卡数据
  const loadCheckInData = async () => {
    try {
      loading.value = true;
      console.log(`加载${selectedPeriod.value}打卡数据开始`);

      // 加载打卡项目
      checkInItems.value = await checkInStore.getCheckInItems();
      console.log(`获取到${checkInItems.value.length}个打卡项目`);

      // 定义分析的时间范围
      const currentRange = calculateDateRange(selectedPeriod.value);
      console.log(
        `当前时间范围: ${currentRange.startDate} 至 ${currentRange.endDate}`
      );

      // 收集指定时间范围内的所有打卡记录
      const checkInsPromises = [];
      let currentDate = dayjs(currentRange.startDate);
      const endDate = dayjs(currentRange.endDate);

      // 按月获取打卡记录，因为API是按月获取的
      while (
        currentDate.isBefore(endDate) ||
        currentDate.isSame(endDate, "day")
      ) {
        const year = currentDate.year();
        const month = currentDate.month() + 1;
        console.log(`准备获取 ${year}年${month}月 的打卡记录`);
        checkInsPromises.push(checkInStore.getUserCheckIns(year, month));
        currentDate = currentDate.add(1, "month").startOf("month");
      }

      console.log(`共需加载${checkInsPromises.length}个月的打卡数据`);
      const checkInsResults = await Promise.all(checkInsPromises);
      const allCheckInsData = checkInsResults.flat();
      console.log(`获取到总计${allCheckInsData.length}条打卡记录`);

      // 过滤出当前时间范围内的打卡记录
      const startDateObj = dayjs(currentRange.startDate);
      const endDateObj = dayjs(currentRange.endDate);
      allCheckIns.value = allCheckInsData.filter((checkIn) => {
        const checkInDate = dayjs(checkIn.date);
        return (
          (checkInDate.isAfter(startDateObj, "day") ||
            checkInDate.isSame(startDateObj, "day")) &&
          (checkInDate.isBefore(endDateObj, "day") ||
            checkInDate.isSame(endDateObj, "day"))
        );
      });

      console.log(
        `过滤后当前时间范围内共有${allCheckIns.value.length}条打卡记录`
      );

      // 加载连续打卡数据
      streakData.value = [];
      if (checkInItems.value.length > 0) {
        checkInItems.value.forEach((item) => {
          // 跳过名为'undefined'的项目
          if (item.name === "undefined") {
            return;
          }

          let maxStreak = 0;
          let currentStreak = 0;
          let currentDate = endDateObj.clone();

          // 计算当前连续打卡天数
          while (currentDate.isSameOrAfter(startDateObj, "day")) {
            const date = currentDate.format("YYYY-MM-DD");
            const hasCheckIn = allCheckIns.value.some(
              (checkIn) =>
                checkIn.item_id === item.id &&
                dayjs(checkIn.date).format("YYYY-MM-DD") === date
            );

            if (hasCheckIn) {
              currentStreak++;
            } else {
              break;
            }

            currentDate = currentDate.subtract(1, "day");
          }

          if (currentStreak > 0) {
            streakData.value.push({
              id: item.id,
              name: item.name,
              color: item.color,
              streak: currentStreak,
            });
          }
        });
      }

      // 分析数据
      analyzeCheckInData();

      // 如果需要对比数据，加载之前的数据
      if (showComparison.value) {
        await loadPreviousData();
      }

      console.log(`${selectedPeriod.value}打卡数据加载完成`);
    } catch (error) {
      console.error("加载打卡统计数据失败:", error);
    } finally {
      loading.value = false;
    }
  };

  // 加载上一时间段的数据进行对比
  const loadPreviousData = async () => {
    try {
      // 当前日期范围
      const currentRange = calculateDateRange(selectedPeriod.value);
      const currentStartDate = dayjs(currentRange.startDate);
      const currentEndDate = dayjs(currentRange.endDate);
      const dayCount = currentEndDate.diff(currentStartDate, "day") + 1;

      // 上一时间段日期范围
      const previousStartDate = currentStartDate.subtract(dayCount, "day");
      const previousEndDate = currentEndDate.subtract(dayCount, "day");

      // 收集上一时间段的所有打卡记录
      const checkInsPromises = [];
      let currentDate = previousStartDate;

      // 按月获取打卡记录
      while (
        currentDate.isBefore(previousEndDate) ||
        currentDate.isSame(previousEndDate, "day")
      ) {
        const year = currentDate.year();
        const month = currentDate.month() + 1;
        checkInsPromises.push(checkInStore.getUserCheckIns(year, month));
        currentDate = currentDate.add(1, "month").startOf("month");
      }

      const checkInsResults = await Promise.all(checkInsPromises);
      const allPreviousCheckIns = checkInsResults.flat();

      // 过滤出上一时间段的打卡记录
      const previousCheckIns = allPreviousCheckIns.filter((checkIn) => {
        const checkInDate = dayjs(checkIn.date);
        return (
          (checkInDate.isAfter(previousStartDate, "day") ||
            checkInDate.isSame(previousStartDate, "day")) &&
          (checkInDate.isBefore(previousEndDate, "day") ||
            checkInDate.isSame(previousEndDate, "day"))
        );
      });

      // 分析上一时间段的数据
      analyzePreviousData(previousCheckIns, previousStartDate, previousEndDate);
    } catch (error) {
      console.error("加载上一时间段打卡数据失败:", error);
    }
  };

  // 分析当前打卡数据
  const analyzeCheckInData = () => {
    if (!checkInItems.value.length) return;

    const currentRange = calculateDateRange(selectedPeriod.value);
    const startDate = dayjs(currentRange.startDate);
    const endDate = dayjs(currentRange.endDate);
    const totalDays = endDate.diff(startDate, "day") + 1;

    // 计算总完成率
    const totalPossibleCheckIns = checkInItems.value.length * totalDays;
    const totalCompletedCheckIns = allCheckIns.value.length;
    try {
      if (totalPossibleCheckIns > 0) {
        const rawRate = (totalCompletedCheckIns / totalPossibleCheckIns) * 100;
        const rate = rawRate.toFixed(1);
        completionRate.value = rate;
        console.log(
          `计算完成率：${totalCompletedCheckIns}/${totalPossibleCheckIns} = ${rawRate}% (${rate}%)`
        );
      } else {
        completionRate.value = "0.0";
        console.log(`计算完成率：无可能的打卡项，设为0.0%`);
      }
    } catch (error) {
      console.error("计算完成率出错:", error);
      completionRate.value = "0.0";
    }

    // 分析各项目的完成情况
    itemsCompletionData.value = checkInItems.value.map((item) => {
      const itemCheckIns = allCheckIns.value.filter(
        (checkIn) => checkIn.item_id === item.id
      );
      const completionRate =
        totalDays > 0
          ? ((itemCheckIns.length / totalDays) * 100).toFixed(1)
          : 0;

      return {
        id: item.id,
        name: item.name,
        color: item.color,
        completionCount: itemCheckIns.length,
        possibleCount: totalDays,
        completionRate: parseFloat(completionRate),
      };
    });

    // 生成每日完成数据
    dailyCompletionData.value = [];
    let currentDate = startDate;
    while (
      currentDate.isBefore(endDate) ||
      currentDate.isSame(endDate, "day")
    ) {
      const dayFormatted = currentDate.format("YYYY-MM-DD");
      const dayCheckIns = allCheckIns.value.filter(
        (checkIn) => dayjs(checkIn.date).format("YYYY-MM-DD") === dayFormatted
      );

      dailyCompletionData.value.push({
        date: dayFormatted,
        completionCount: dayCheckIns.length,
        possibleCount: checkInItems.value.length,
        completionRate:
          checkInItems.value.length > 0
            ? (dayCheckIns.length / checkInItems.value.length) * 100
            : 0,
      });

      currentDate = currentDate.add(1, "day");
    }
  };

  // 分析上一时间段的数据
  const analyzePreviousData = (previousCheckIns, startDate, endDate) => {
    if (!checkInItems.value.length) return;

    const totalDays = endDate.diff(startDate, "day") + 1;

    // 计算总完成率
    const totalPossibleCheckIns = checkInItems.value.length * totalDays;
    const totalCompletedCheckIns = previousCheckIns.length;
    try {
      if (totalPossibleCheckIns > 0) {
        const rawRate = (totalCompletedCheckIns / totalPossibleCheckIns) * 100;
        const rate = rawRate.toFixed(1);
        previousCompletionRate.value = rate;
        console.log(
          `计算上一时段完成率：${totalCompletedCheckIns}/${totalPossibleCheckIns} = ${rawRate}% (${rate}%)`
        );
      } else {
        previousCompletionRate.value = "0.0";
        console.log(`计算上一时段完成率：无可能的打卡项，设为0.0%`);
      }
    } catch (error) {
      console.error("计算上一时段完成率出错:", error);
      previousCompletionRate.value = "0.0";
    }

    // 分析各项目的完成情况
    previousItemsCompletionData.value = checkInItems.value.map((item) => {
      const itemCheckIns = previousCheckIns.filter(
        (checkIn) => checkIn.item_id === item.id
      );
      const completionRate =
        totalDays > 0
          ? ((itemCheckIns.length / totalDays) * 100).toFixed(1)
          : 0;

      return {
        id: item.id,
        name: item.name,
        color: item.color,
        completionCount: itemCheckIns.length,
        possibleCount: totalDays,
        completionRate: parseFloat(completionRate),
      };
    });

    // 生成每日完成数据
    previousDailyCompletionData.value = [];
    let currentDate = startDate;
    while (
      currentDate.isBefore(endDate) ||
      currentDate.isSame(endDate, "day")
    ) {
      const dayFormatted = currentDate.format("YYYY-MM-DD");
      const dayCheckIns = previousCheckIns.filter(
        (checkIn) => dayjs(checkIn.date).format("YYYY-MM-DD") === dayFormatted
      );

      previousDailyCompletionData.value.push({
        date: dayFormatted,
        completionCount: dayCheckIns.length,
        possibleCount: checkInItems.value.length,
        completionRate:
          checkInItems.value.length > 0
            ? (dayCheckIns.length / checkInItems.value.length) * 100
            : 0,
      });

      currentDate = currentDate.add(1, "day");
    }
  };

  // 刷新数据
  const refreshData = async () => {
    console.log(`切换到${selectedPeriod.value}时间段，刷新数据`);
    // 重置数据
    completionRate.value = "0.0";
    previousCompletionRate.value = "0.0";
    allCheckIns.value = [];
    itemsCompletionData.value = [];
    previousItemsCompletionData.value = [];
    dailyCompletionData.value = [];
    previousDailyCompletionData.value = [];
    streakData.value = [];

    await loadCheckInData();
  };

  // 计算属性：是否有打卡数据
  const hasCheckInData = computed(() => {
    return checkInItems.value.length > 0;
  });

  // 计算属性：时间段实际天数
  const actualPeriodDays = computed(() => {
    const currentRange = calculateDateRange(selectedPeriod.value);
    const startDate = dayjs(currentRange.startDate);
    const endDate = dayjs(currentRange.endDate);
    return endDate.diff(startDate, "day") + 1; // 包含开始日期和结束日期
  });

  // 计算属性：时间段显示文本
  const periodText = computed(() => {
    switch (selectedPeriod.value) {
      case "week":
        return "周";
      case "month":
        return "月";
      case "year":
        return "年";
      default:
        return "周";
    }
  });

  // 计算属性：时间段显示文本（带天数）
  const periodTextWithDays = computed(() => {
    return `${periodText.value}(${actualPeriodDays.value}天)`;
  });

  // 监听身份验证状态变化
  watch(
    () => authStore.isAuthenticated,
    (isAuthenticated) => {
      if (isAuthenticated) {
        loadCheckInData();
      }
    }
  );

  // 生命周期钩子
  onMounted(() => {
    if (authStore.isAuthenticated) {
      loadCheckInData();
    }
  });

  return {
    router,
    loading,
    selectedPeriod,
    showComparison,
    completionRate,
    previousCompletionRate,
    itemsCompletionData,
    previousItemsCompletionData,
    dailyCompletionData,
    previousDailyCompletionData,
    streakData,
    hasCheckInData,
    periodTextWithDays,
    refreshData,
  };
}
