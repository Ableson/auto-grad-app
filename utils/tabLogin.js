import { isLoggedIn } from '@/utils/auth'

const LOGIN_PAGE = '/pages/login'

/** Tab 页（消息/我的）内跳转登录，避免与 switchTab 并发 navigateTo 导致 timeout */
export function goLoginFromTab() {
  uni.navigateTo({
    url: LOGIN_PAGE,
    fail() {
      uni.reLaunch({ url: LOGIN_PAGE })
    }
  })
}

export { isLoggedIn }
