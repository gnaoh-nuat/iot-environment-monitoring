const pendingTimeouts = new Map();

const scheduleActionTimeout = (actionId, callback, timeoutMs = 10000) => {
  const key = String(actionId);

  // Dọn dẹp timeout cũ nếu có trước khi đặt mới
  clearActionTimeout(key);

  const timeoutId = setTimeout(async () => {
    pendingTimeouts.delete(key);
    await callback();
  }, timeoutMs);

  pendingTimeouts.set(key, timeoutId);
};

const clearActionTimeout = (actionId) => {
  const key = String(actionId);

  // Tối ưu: Chỉ cần check và xóa, không cần trả về true/false thừa thãi
  if (pendingTimeouts.has(key)) {
    clearTimeout(pendingTimeouts.get(key));
    pendingTimeouts.delete(key);
  }
};

module.exports = {
  scheduleActionTimeout,
  clearActionTimeout,
};
