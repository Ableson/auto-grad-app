import { handleSessionExpired, clearSessionLock, isSessionLocked } from '@/utils/auth'
import { useUserStore } from '@/store/modules/user'
import { showConfirm } from '@/utils/common'

let showingExpireDialog = false

/** 弹出登录过期提示；确认后去登录，取消则保持当前页且禁止跳转 */
export function promptSessionExpiredDialog() {
  if (showingExpireDialog) return
  showingExpireDialog = true
  showConfirm('登录状态已过期，您可以继续留在该页面，或者重新登录?').then(res => {
    showingExpireDialog = false
    if (res.confirm) {
      clearSessionLock()
      useUserStore().resetLocalSession()
      uni.reLaunch({ url: '/pages/login' })
    }
  })
}

/** 接口 401 处理（非公开接口） */
export function handleHttp401(skipToken) {
  if (skipToken) return false
  handleSessionExpired()
  try {
    useUserStore().resetLocalSession()
  } catch (e) {
    // store 尚未初始化时忽略
  }
  promptSessionExpiredDialog()
  return true
}

/** 会话已锁定时拦截页面跳转，并再次提示 */
export function blockNavigationWhenSessionLocked() {
  if (!isSessionLocked()) return false
  promptSessionExpiredDialog()
  return true
}
