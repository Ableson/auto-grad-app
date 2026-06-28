import request from '@/utils/request'

/** 用户中心统计 */
export function getUserCenterStats() {
  return request({
    url: '/house/user/center/stats',
    method: 'get'
  })
}

/** 动态统计配置（recentDays、matchLevel） */
export function getDynamicConfig() {
  return request({
    url: '/house/user/center/dynamic-config',
    method: 'get'
  })
}

/** 同步用户完整定位 */
export function syncUserLocation(data) {
  return request({
    url: '/house/user/center/location',
    method: 'post',
    data
  })
}

/** @deprecated 使用 syncUserLocation */
export function syncUserProvince(provinceName) {
  return syncUserLocation({ provinceName })
}
