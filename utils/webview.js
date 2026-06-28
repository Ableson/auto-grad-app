/** 通过 storage 传递 webview 目标地址，避免 query 超长或被 & 截断 */
export const WEBVIEW_URL_KEY = 'app_webview_url'

function normalizeWebUrl(url) {
  if (!url) return ''
  let target = String(url).trim()
  if (!target) return ''
  try {
    if (/%[0-9A-Fa-f]{2}/.test(target)) {
      target = decodeURIComponent(target)
    }
  } catch (e) {
    // 保持原样
  }
  if (!/^https?:\/\//i.test(target)) {
    if (target.startsWith('//')) {
      target = `https:${target}`
    } else {
      target = `https://${target}`
    }
  }
  return target
}

/**
 * 打开内置 webview（长链接走 storage，短链接仍兼容 url 参数）
 */
export function openWebView(url, options = {}) {
  const target = normalizeWebUrl(url)
  if (!target) {
    uni.showToast({ title: '链接无效', icon: 'none' })
    return
  }
  uni.setStorageSync(WEBVIEW_URL_KEY, target)
  const titleQuery = options.title ? `&title=${encodeURIComponent(options.title)}` : ''
  uni.navigateTo({
    url: `/pages/common/webview/index?from=storage${titleQuery}`
  })
}

export function readStoredWebViewUrl() {
  const url = uni.getStorageSync(WEBVIEW_URL_KEY) || ''
  uni.removeStorageSync(WEBVIEW_URL_KEY)
  return normalizeWebUrl(url)
}

export function copyWebViewUrl(url) {
  const target = normalizeWebUrl(url)
  if (!target) {
    uni.showToast({ title: '链接无效', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: target,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'success' })
    }
  })
}
