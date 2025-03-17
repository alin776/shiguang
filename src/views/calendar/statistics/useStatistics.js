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
    const today = dayjs();
    let startDate;
    let endDate = today.clone(); // 克隆对象以防止修改原始对象

    switch (period) {
      case "week":
        // 获取本周一作为开始日期
        const dayOfWeek = today.day(); // 0是周日，1是周一
        if (dayOfWeek === 0) {
          // 如果今天是周日，则本周一是6天前
          startDate = today.clone().subtract(6, "day");
        } else {
          // 其他情况，回退到本周一
          startDate = today.clone().subtract(dayOfWeek - 1, "day");
        }
        break;
      case "month":
        // 获取当前月份的第一天
        startDate = today.clone().startOf('month');
        break;
      case "year":
        // 获取当前年份的第一天
        startDate = today.clone().startOf('year');
        break;
      default:
        // 默认使用本周一
        const defaultDayOfWeek = today.day();
        if (defaultDayOfWeek === 0) {
          startDate = today.clone().subtract(6, "day");
        } else {
          startDate = today.clone().subtract(defaultDayOfWeek - 1, "day");
        }
    }

    // 确保开始日期不晚于结束日期
    if (startDate.isAfter(endDate)) {
      console.warn(`日期范围错误：开始日期(${startDate.format('YYYY-MM-DD')})晚于结束日期(${endDate.format('YYYY-MM-DD')})，将使用今天和前7天`);
      startDate = today.clone().subtract(7, "day");
      endDate = today.clone();
    }

    const result = {
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
    };

    // 验证日期范围
    const start = dayjs(result.startDate);
    const end = dayjs(result.endDate);
    const daysDiff = end.diff(start, "day");
    
    console.log(`日期范围验证：从 ${result.startDate} 到 ${result.endDate}，共 ${daysDiff + 1} 天`);
    
    if (daysDiff < 0) {
      console.error("计算出的日期范围无效，结束日期早于开始日期");
      // 修正为今天和前7天
      result.startDate = today.clone().subtract(7, "day").format("YYYY-MM-DD");
      result.endDate = today.clone().format("YYYY-MM-DD");
      console.log(`修正后的日期范围：从 ${result.startDate} 到 ${result.endDate}`);
    }

    return result;
  };

  // 加载打卡数据
  const loadCheckInData = async () => {
    try {
      loading.value = true;
      console.log(`加载${selectedPeriod.value}打卡数据开始`);

      // 加载打卡项目
      try {
        checkInItems.value = await checkInStore.getCheckInItems();
        console.log(`获取到${checkInItems.value ? checkInItems.value.length : 0}个打卡项目:`, checkInItems.value);
      } catch (error) {
        console.error("获取打卡项目失败:", error);
        checkInItems.value = []; // 确保不为null
      }

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
        checkInsPromises.push(
          checkInStore.getUserCheckIns(year, month)
            .catch(err => {
              console.error(`获取${year}年${month}月打卡记录失败:`, err);
              return []; // 错误时返回空数组
            })
        );
        currentDate = currentDate.add(1, "month").startOf("month");
      }

      console.log(`共需加载${checkInsPromises.length}个月的打卡数据`);
      const checkInsResults = await Promise.all(checkInsPromises);
      const allCheckInsData = checkInsResults.flat().filter(item => item); // 过滤掉可能的null或undefined
      console.log(`获取到总计${allCheckInsData.length}条打卡记录:`, allCheckInsData);

      // 过滤出当前时间范围内的打卡记录
      const startDateObj = dayjs(currentRange.startDate);
      const endDateObj = dayjs(currentRange.endDate);
      try {
        allCheckIns.value = allCheckInsData.filter((checkIn) => {
          if (!checkIn || !checkIn.date) return false;
          const checkInDate = dayjs(checkIn.date);
          return (
            (checkInDate.isAfter(startDateObj, "day") ||
              checkInDate.isSame(startDateObj, "day")) &&
            (checkInDate.isBefore(endDateObj, "day") ||
              checkInDate.isSame(endDateObj, "day"))
          );
        });

        console.log(
          `过滤后当前时间范围内共有${allCheckIns.value.length}条打卡记录:`, 
          allCheckIns.value
        );
      } catch (error) {
        console.error("过滤打卡记录失败:", error);
        allCheckIns.value = []; // 确保不为null
      }

      // 加载连续打卡数据
      try {
        streakData.value = [];
        if (checkInItems.value && checkInItems.value.length > 0) {
          checkInItems.value.forEach((item) => {
            // 跳过名为'undefined'的项目或无效项目
            if (!item || !item.id || item.name === "undefined") {
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
                  checkIn && checkIn.item_id === item.id &&
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
                color: item.color || '#409EFF',
                streak: currentStreak,
              });
            }
          });
        }
        console.log("连续打卡数据:", streakData.value);
      } catch (error) {
        console.error("计算连续打卡数据失败:", error);
        streakData.value = []; // 确保不为null
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
      // 设置默认值以避免页面显示错误
      completionRate.value = "0.0";
      previousCompletionRate.value = "0.0";
      itemsCompletionData.value = [];
      previousItemsCompletionData.value = [];
      dailyCompletionData.value = [];
      previousDailyCompletionData.value = [];
      streakData.value = [];
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
    console.log("开始分析打卡数据...");
    
    try {
      if (!checkInItems.value || checkInItems.value.length === 0) {
        console.warn("打卡项目列表为空，无法分析数据");
        completionRate.value = 0;
        itemsCompletionData.value = [];
        dailyCompletionData.value = [];
        return;
      }

      console.log(`获取到${checkInItems.value.length}个打卡项目:`, checkInItems.value);
      console.log(`获取到总计${allCheckIns.value.length}条打卡记录:`, allCheckIns.value);

      const currentRange = calculateDateRange(selectedPeriod.value);
      console.log(`当前时间范围: ${currentRange.startDate} 至 ${currentRange.endDate}`);
      
      const startDate = dayjs(currentRange.startDate);
      const endDate = dayjs(currentRange.endDate);
      const totalDays = endDate.diff(startDate, "day") + 1;
      
      console.log(`总天数: ${totalDays}`);

      if (totalDays <= 0) {
        console.error(`日期计算错误：总天数(${totalDays})不正确，使用默认值1`);
        // 使用默认值防止计算错误
        const totalPossibleCheckIns = checkInItems.value.length;
        const totalCompletedCheckIns = allCheckIns.value.length;
        
        if (totalPossibleCheckIns > 0) {
          const rate = (totalCompletedCheckIns / totalPossibleCheckIns) * 100;
          completionRate.value = rate.toFixed(1);
          console.log(`计算默认完成率：${totalCompletedCheckIns}/${totalPossibleCheckIns} = ${rate.toFixed(1)}%`);
        } else {
          completionRate.value = 0;
          console.log("计算完成率：无可能的打卡项，设为0%");
        }
        
        itemsCompletionData.value = [];
        dailyCompletionData.value = [];
        return;
      }

      // 计算总完成率
      const totalPossibleCheckIns = checkInItems.value.length * totalDays;
      const totalCompletedCheckIns = allCheckIns.value.length;
      
      console.log(`可能的总打卡次数: ${totalPossibleCheckIns} (${checkInItems.value.length} 个项目 x ${totalDays} 天)`);
      console.log(`实际完成的打卡次数: ${totalCompletedCheckIns}`);
      
      if (totalPossibleCheckIns > 0) {
        const rate = (totalCompletedCheckIns / totalPossibleCheckIns) * 100;
        completionRate.value = parseFloat(rate.toFixed(1));
        console.log(`计算完成率：${totalCompletedCheckIns}/${totalPossibleCheckIns} = ${rate.toFixed(1)}%`);
      } else {
        completionRate.value = 0;
        console.log("计算完成率：无可能的打卡项，设为0%");
      }

      // 分析各项目的完成情况
      const tempItemsData = [];
      checkInItems.value.forEach(item => {
        const itemCheckIns = allCheckIns.value.filter(
          (checkIn) => checkIn.item_id === item.id
        );
        const rate = totalDays > 0
            ? ((itemCheckIns.length / totalDays) * 100)
            : 0;
            
        tempItemsData.push({
          id: item.id,
          name: item.name,
          color: item.color,
          completionCount: itemCheckIns.length,
          possibleCount: totalDays,
          completionRate: parseFloat(rate.toFixed(1)),
        });
      });
      itemsCompletionData.value = tempItemsData;
      console.log("项目完成情况:", tempItemsData);

      // 生成每日完成数据
      const tempDailyData = [];
      let currentDate = startDate.clone();
      while (
        currentDate.isSameOrBefore(endDate, "day")
      ) {
        const dayFormatted = currentDate.format("YYYY-MM-DD");
        const dayCheckIns = allCheckIns.value.filter(
          (checkIn) => dayjs(checkIn.date).format("YYYY-MM-DD") === dayFormatted
        );

        tempDailyData.push({
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
      dailyCompletionData.value = tempDailyData;
      console.log("每日完成数据:", tempDailyData);
    } catch (error) {
      console.error("分析打卡数据失败:", error);
      completionRate.value = 0;
      itemsCompletionData.value = [];
      dailyCompletionData.value = [];
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
    return (
      checkInItems.value && 
      checkInItems.value.length > 0 && 
      (checkInItems.value.some(item => item && item.id) || 
       allCheckIns.value && allCheckIns.value.length > 0)
    );
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
  onMounted(async () => {
    console.log("打卡统计组件挂载，开始加载数据");
    try {
      await refreshData();
    } catch (error) {
      console.error("初始化打卡统计数据失败:", error);
      loading.value = false;
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
