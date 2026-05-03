export const formatDateTime = (value) => {
  const date = new Date(value);

  // Gộp check null/undefined và check Invalid Date vào 1 dòng
  if (!value || isNaN(date)) return "--";

  const pad = (num) => String(num).padStart(2, "0");

  // Trả về trực tiếp chuỗi đã format (giữ nguyên behavior Local Time của bạn)
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
