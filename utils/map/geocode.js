import { normalizeProvinceName } from '@/utils/province'
import { getMapApiKey, getMapProvider, getMapConfig } from '@/utils/map/config'

function parseGeoResult(province, city, district, address) {
  let normalized = normalizeProvinceName(province)
  if (!normalized && city) {
    normalized = normalizeProvinceName(city)
  }
  return {
    province: normalized,
    city: city || '',
    district: district || '',
    address: address || ''
  }
}

function requestGeocode(url, data) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      data,
      success: (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        resolve(res.data)
      },
      fail: reject
    })
  })
}

function isSuccessStatus(status) {
  return Number(status) === 0
}

/** 腾讯地图逆地理编码 */
async function reverseGeocodeTencent(latitude, longitude) {
  const key = getMapApiKey('tencent')
  if (!key) throw new Error('未配置腾讯地图 Key')
  const data = await requestGeocode('https://apis.map.qq.com/ws/geocoder/v1/', {
    location: `${latitude},${longitude}`,
    key,
    get_poi: 0
  })
  if (!isSuccessStatus(data.status) || !data.result) {
    throw new Error(data.message || `腾讯逆地理编码失败(${data.status})`)
  }
  const adInfo = data.result.ad_info || {}
  return parseGeoResult(adInfo.province, adInfo.city, adInfo.district, data.result.address)
}

/** 高德地图逆地理编码（location 为 经度,纬度） */
async function reverseGeocodeAmap(latitude, longitude) {
  const key = getMapApiKey('amap')
  if (!key) throw new Error('未配置高德地图 Key')
  const data = await requestGeocode('https://restapi.amap.com/v3/geocode/regeo', {
    location: `${longitude},${latitude}`,
    key,
    extensions: 'base'
  })
  if (String(data.status) !== '1' || !data.regeocode) {
    throw new Error(data.info || `高德逆地理编码失败(${data.status})`)
  }
  const comp = data.regeocode.addressComponent || {}
  return parseGeoResult(comp.province, comp.city, comp.district, data.regeocode.formatted_address)
}

/** 百度地图逆地理编码（coordtype=gcj02ll 与 uni.getLocation gcj02 对齐） */
async function reverseGeocodeBaidu(latitude, longitude) {
  const key = getMapApiKey('baidu')
  if (!key) throw new Error('未配置百度地图 Key')
  const data = await requestGeocode('https://api.map.baidu.com/reverse_geocoding/v3/', {
    ak: key,
    output: 'json',
    coordtype: 'gcj02ll',
    ret_coordtype: 'gcj02ll',
    location: `${latitude},${longitude}`
  })
  if (!isSuccessStatus(data.status) || !data.result) {
    const detail = data.msg || data.message || `status=${data.status}`
    throw new Error(`百度逆地理编码失败：${detail}`)
  }
  const comp = data.result.addressComponent || {}
  return parseGeoResult(comp.province, comp.city, comp.district, data.result.formatted_address)
}

const GEOCODERS = {
  tencent: reverseGeocodeTencent,
  amap: reverseGeocodeAmap,
  baidu: reverseGeocodeBaidu
}

/** 按指定 provider 逆地理编码 */
export function reverseGeocode(latitude, longitude, provider) {
  const current = provider || getMapProvider()
  const handler = GEOCODERS[current]
  if (!handler) {
    return Promise.reject(new Error(`不支持的地图服务商: ${current}`))
  }
  return handler(latitude, longitude)
}

/** 依次尝试已配置 Key 的地图服务（当前 provider 优先，微信小程序建议配置腾讯 Key） */
export async function reverseGeocodeWithFallback(latitude, longitude) {
  const { provider, keys } = getMapConfig()
  const order = [provider, 'tencent', 'amap', 'baidu'].filter((item, index, arr) => arr.indexOf(item) === index)
  let lastError = null

  for (const name of order) {
    if (!keys[name]) continue
    try {
      const result = await GEOCODERS[name](latitude, longitude)
      if (result.province) {
        return result
      }
    } catch (err) {
      lastError = err
      console.warn(`[${name}] 逆地理编码失败`, err.message || err)
    }
  }

  throw lastError || new Error('未配置可用的地图 Key')
}
