import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

/**
 * 格式化时间为相对时间（如：几分钟前、几小时前等）
 * @param {string} time - 需要格式化的时间
 * @returns {string} 格式化后的相对时间字符串
 */
export const formatTime = (time) => {
  if (!time) return "";

  const date = dayjs(time);
  const now = dayjs();

  // 如果时间在一天以内，显示相对时间
  if (now.diff(date, "day") < 1) {
    return date.fromNow();
  }

  // 如果时间在今年内，显示月日和时间
  if (now.year() === date.year()) {
    return date.format("MM-DD HH:mm");
  }

  // 否则显示完整日期
  return date.format("YYYY-MM-DD HH:mm");
};

/**
 * 格式化日期为指定格式
 * @param {string} date - 需要格式化的日期
 * @param {string} format - 格式模板
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date, format = "YYYY-MM-DD") => {
  if (!date) return "";
  return dayjs(date).format(format);
};

/**
 * 获取今天的日期字符串
 * @param {string} format - 格式模板
 * @returns {string} 今天的日期字符串
 */
export const today = (format = "YYYY-MM-DD") => {
  return dayjs().format(format);
};

export default {
  formatTime,
  formatDate,
  today,
};
