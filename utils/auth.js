const TokenKey = 'App-Token'
const SessionLockKey = 'App-Session-Lock'

export function getToken() {
  return uni.getStorageSync(TokenKey)
}

export function setToken(token) {
  clearSessionLock()
  return uni.setStorageSync(TokenKey, token)
}

export function removeToken() {
  return uni.removeStorageSync(TokenKey)
}

export function isSessionLocked() {
  return !!uni.getStorageSync(SessionLockKey)
}

export function setSessionLocked(locked) {
  if (locked) {
    uni.setStorageSync(SessionLockKey, '1')
  } else {
    uni.removeStorageSync(SessionLockKey)
  }
}

export function clearSessionLock() {
  uni.removeStorageSync(SessionLockKey)
}

/** 是否已登录（有有效 token 且未处于会话过期锁定） */
export function isLoggedIn() {
  return !!getToken() && !isSessionLocked()
}

/** 登录过期：清除 token 并锁定导航，仅允许留在当前页 */
export function handleSessionExpired() {
  removeToken()
  setSessionLocked(true)
}
