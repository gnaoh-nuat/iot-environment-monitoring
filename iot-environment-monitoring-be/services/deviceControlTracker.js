const pendingTimeouts = new Map();

const normalizeActionKey = (actionId) => String(actionId);

const scheduleActionTimeout = (actionId, callback, timeoutMs = 10000) => {
  const actionKey = normalizeActionKey(actionId);
  clearActionTimeout(actionKey);

  const timeoutId = setTimeout(async () => {
    pendingTimeouts.delete(actionKey);
    await callback();
  }, timeoutMs);

  pendingTimeouts.set(actionKey, timeoutId);
};

const clearActionTimeout = (actionId) => {
  const actionKey = normalizeActionKey(actionId);
  const timeoutId = pendingTimeouts.get(actionKey);
  if (timeoutId) {
    clearTimeout(timeoutId);
    pendingTimeouts.delete(actionKey);
    return true;
  }

  return false;
};

module.exports = {
  scheduleActionTimeout,
  clearActionTimeout,
};
