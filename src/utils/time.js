export function formatTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const oneMinute = 60 * 1000;
  const oneHour = oneMinute * 60;
  const oneDay = oneHour * 24;

  if (diff < oneMinute) {
    return "刚刚";
  } else if (diff < oneHour) {
    return `${Math.floor(diff / oneMinute)}分钟前`;
  } else if (diff < oneDay) {
    return `${Math.floor(diff / oneHour)}小时前`;
  } else if (diff < oneDay * 7) {
    return `${Math.floor(diff / oneDay)}天前`;
  } else {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}
