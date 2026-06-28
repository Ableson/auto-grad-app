import config from '@/config'

const STORAGE_KEY = 'house_search_history'

function getMaxSize() {
  const max = config.searchHistoryMax
  return typeof max === 'number' && max > 0 ? max : 10
}

/** 本地搜索历史（展示用，未登录也可使用） */
export function getLocalSearchHistory() {
  try {
    const list = uni.getStorageSync(STORAGE_KEY)
    return Array.isArray(list) ? list : []
  } catch (e) {
    return []
  }
}

export function saveLocalSearchHistory(keyword) {
  const text = (keyword || '').trim()
  if (!text) return
  const max = getMaxSize()
  let list = getLocalSearchHistory().filter(item => item !== text)
  list.unshift(text)
  if (list.length > max) {
    list = list.slice(0, max)
  }
  uni.setStorageSync(STORAGE_KEY, list)
}

export function clearLocalSearchHistory() {
  uni.removeStorageSync(STORAGE_KEY)
}
