import { openProvincePicker } from '@/utils/provincePicker'
import { getLocationType } from '@/utils/map/config'
import { reverseGeocodeWithFallback } from '@/utils/map/geocode'

/** 用户手动选择的省份（含「全国」），长期有效 */
const PROVINCE_STORAGE_KEY = 'user_province_name'
const PROVINCE_MANUAL_KEY = 'user_province_manual'

/** GPS + 逆地理编码结果缓存 */
const LOCATION_CACHE_KEY = 'user_location_cache'

/** 定位缓存有效期：24 小时（行业常用 coarse location TTL） */
export const LOCATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000

function readStorage(key) {
  try {
    const raw = uni.getStorageSync(key)
    if (!raw) return null
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  uni.setStorageSync(key, value)
}

function removeStorage(key) {
  uni.removeStorageSync(key)
}

export function hasManualProvincePreference() {
  return !!uni.getStorageSync(PROVINCE_MANUAL_KEY)
}

export function getStoredProvince() {
  return uni.getStorageSync(PROVINCE_STORAGE_KEY) || ''
}

export function setStoredProvince(provinceName) {
  if (provinceName) {
    uni.setStorageSync(PROVINCE_STORAGE_KEY, provinceName)
  } else {
    uni.removeStorageSync(PROVINCE_STORAGE_KEY)
  }
}

/** 记录用户手动切换的省份（含全国），不再自动 GPS 定位 */
export function setManualProvincePreference(provinceName) {
  uni.setStorageSync(PROVINCE_MANUAL_KEY, '1')
  setStoredProvince(provinceName)
}

/** 清除手动省份偏好，恢复自动定位 */
export function clearManualProvincePreference() {
  uni.removeStorageSync(PROVINCE_MANUAL_KEY)
}

export function getLocationCache() {
  const cache = readStorage(LOCATION_CACHE_KEY)
  if (!cache?.cachedAt || !cache.provinceName) return null
  if (Date.now() - cache.cachedAt > LOCATION_CACHE_TTL_MS) {
    removeStorage(LOCATION_CACHE_KEY)
    return null
  }
  return cache
}

export function setLocationCache(result) {
  if (!result?.provinceName) return
  writeStorage(LOCATION_CACHE_KEY, {
    provinceName: result.provinceName,
    cityName: result.cityName || '',
    districtName: result.districtName || '',
    latitude: result.location?.latitude ?? null,
    longitude: result.location?.longitude ?? null,
    address: result.address || '',
    cachedAt: Date.now()
  })
  if (!hasManualProvincePreference()) {
    setStoredProvince(result.provinceName)
  }
}

export function clearLocationCache() {
  removeStorage(LOCATION_CACHE_KEY)
}

function cacheToResult(cache) {
  const location =
    cache.latitude != null && cache.longitude != null
      ? { latitude: cache.latitude, longitude: cache.longitude }
      : null
  return {
    provinceName: cache.provinceName,
    cityName: cache.cityName || '',
    districtName: cache.districtName || '',
    location,
    address: cache.address || '',
    fromCache: true
  }
}

/**
 * 读取可用定位（优先手动偏好，其次未过期的 GPS 缓存）
 * @returns { provinceName, location, address, fromCache?, fromManual? } | null
 */
export function getEffectiveLocation(options = {}) {
  const { forceRefresh = false } = options

  if (!forceRefresh && hasManualProvincePreference()) {
    return {
      provinceName: getStoredProvince(),
      location: null,
      address: '',
      fromCache: true,
      fromManual: true
    }
  }

  if (!forceRefresh) {
    const cache = getLocationCache()
    if (cache) return cacheToResult(cache)
  }

  return null
}

/** 获取当前经纬度（gcj02） */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: getLocationType(),
      isHighAccuracy: true,
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude
        })
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 自动定位并解析省份（不弹选手动选省，除非 allowManual=true）
 * @param {boolean} options.allowManual 失败时是否打开省份选择页
 * @param {boolean} options.forceRefresh 为 true 时跳过缓存并重新定位
 */
export async function resolveCurrentProvince(options = {}) {
  const { allowManual = false, forceRefresh = false } = options

  if (!forceRefresh) {
    const effective = getEffectiveLocation({ forceRefresh: false })
    if (effective) return effective
  }

  try {
    const location = await getCurrentLocation()
    const geo = await reverseGeocodeWithFallback(location.latitude, location.longitude)
    if (geo?.province) {
      const result = {
        provinceName: geo.province,
        cityName: geo.city || '',
        districtName: geo.district || '',
        location,
        address: geo.address || ''
      }
      setLocationCache(result)
      return result
    }
  } catch (err) {
    console.warn('自动定位失败', err)
  }

  if (allowManual) {
    const provinceName = await openProvincePicker(getStoredProvince())
    setManualProvincePreference(provinceName || '')
    return {
      provinceName: provinceName || '',
      location: null,
      address: ''
    }
  }
  return null
}

/** 兼容旧调用：自动定位，失败时才手动选省 */
export async function getCurrentProvinceName() {
  const result = await resolveCurrentProvince({ allowManual: false })
  if (result?.provinceName) {
    return result
  }
  const provinceName = await openProvincePicker(getStoredProvince())
  setManualProvincePreference(provinceName || '')
  return {
    provinceName: provinceName || '',
    location: null,
    address: ''
  }
}

/** 手动选择省份（空字符串表示全国） */
export function chooseProvinceManually(current = '') {
  return openProvincePicker(current)
}

/** 构建可同步到服务端的定位 payload */
export function buildLocationPayload(source = {}) {
  if (!source?.provinceName) return null
  return {
    provinceName: source.provinceName,
    cityName: source.cityName || '',
    districtName: source.districtName || '',
    address: source.address || '',
    latitude: source.location?.latitude ?? source.latitude ?? null,
    longitude: source.location?.longitude ?? source.longitude ?? null
  }
}
