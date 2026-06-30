import { getToken } from '@/utils/auth'
import { getImUnreadCount } from '@/api/im'

/** tabBar 中「消息」页索引：首页0、地图1、消息2、我的3 */
export const IM_TAB_INDEX = 2

const TAB_BAR_ROUTES = new Set([
  'pages/index',
  'pages/house/map',
  'pages/im/index',
  'pages/mine/index'
])

function getCurrentRoute() {
  const pages = getCurrentPages()
  if (!pages.length) return ''
  const page = pages[pages.length - 1]
  return String(page.route || page.__route__ || '').replace(/^\//, '')
}

function isCurrentTabBarPage() {
  return TAB_BAR_ROUTES.has(getCurrentRoute())
}

function removeBadge() {
  return new Promise((resolve) => {
    uni.removeTabBarBadge({
      index: IM_TAB_INDEX,
      success: resolve,
      fail: resolve
    })
  })
}

function setBadge(text) {
  return new Promise((resolve) => {
    uni.setTabBarBadge({
      index: IM_TAB_INDEX,
      text,
      success: resolve,
      fail: resolve
    })
  })
}

export async function refreshImTabBadge() {
  // 微信规定：非 tabBar 页面调用 set/removeTabBarBadge 会报错
  if (!isCurrentTabBarPage()) {
    return
  }
  if (!getToken()) {
    await removeBadge()
    return
  }
  try {
    const res = await getImUnreadCount()
    const total = Number((res.data || res).total) || 0
    if (total > 0) {
      await setBadge(total > 99 ? '99+' : String(total))
    } else {
      await removeBadge()
    }
  } catch (e) {
    // 静默失败，避免角标刷新影响主流程
  }
}
