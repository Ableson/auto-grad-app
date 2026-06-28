import { normalizeProvinceName } from '@/utils/province'
import { openProvincePicker } from '@/utils/provincePicker'
import { getLocationType } from '@/utils/map/config'
import { reverseGeocode } from '@/utils/map/geocode'

/** 获取当前经纬度（gcj02，与国内三家地图兼容） */
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
 * 获取当前所在省份
 * 按 config.map.provider 调用对应地图逆地理编码，失败时手动选省
 */
export async function getCurrentProvinceName() {
  try {
    const location = await getCurrentLocation()
    try {
      const geo = await reverseGeocode(location.latitude, location.longitude)
      if (geo.province) {
        return {
          provinceName: geo.province,
          location,
          address: geo.address
        }
      }
    } catch (geoErr) {
      console.warn('逆地理编码失败，请手动选择省份', geoErr)
    }
    const provinceName = await openProvincePicker()
    return {
      provinceName,
      location,
      address: ''
    }
  } catch (locErr) {
    console.warn('定位失败，请手动选择省份', locErr)
    const provinceName = await openProvincePicker()
    return {
      provinceName,
      location: null,
      address: ''
    }
  }
}

/** 手动选择省份 */
export function chooseProvinceManually(current = '') {
  return openProvincePicker(current)
}
