import { getToken } from '@/utils/auth'
import { blockNavigationWhenSessionLocked } from '@/utils/sessionExpire'

const loginPage = '/pages/login'

/** 未登录可访问的页面（含 Tab：首页、地图、消息、我的） */
const guestAllowList = [
  '/pages/login',
  '/pages/register',
  '/pages/index',
  '/pages/house/map',
  '/pages/im/index',
  '/pages/mine/index',
  '/pages/house/detail/index',
  '/pages/common/webview/index',
  '/pages/common/textview/index',
  '/pages/protocol/index',
  '/pages/common/province/index',
  '/pages/member/index'
]

function getPath(url) {
  return (url || '').split('?')[0]
}

function isGuestAllowed(path) {
  return guestAllowList.indexOf(path) !== -1
}

const navigateMethods = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']
navigateMethods.forEach(item => {
  uni.addInterceptor(item, {
    invoke(to) {
      const path = getPath(to.url)

      if (blockNavigationWhenSessionLocked()) {
        return false
      }

      if (getToken()) {
        if (path === loginPage) {
          uni.reLaunch({ url: '/pages/index' })
          return false
        }
        return true
      }

      if (isGuestAllowed(path)) {
        return true
      }

      uni.navigateTo({ url: loginPage })
      return false
    },
    fail(err) {
      console.log(err)
    }
  })
})
