import { syncUserLocation } from '@/api/userCenter'
import { getToken } from '@/utils/auth'
import {
  buildLocationPayload,
  getEffectiveLocation,
  getStoredProvince
} from '@/utils/location'

let syncing = false

/**
 * 将已有定位/省份同步到服务端（不主动 GPS、不逆地理编码）
 * 仅在登录成功、首页定位完成后等场景调用；需新定位请走 resolveCurrentProvince
 */
export async function syncLocationToServer(options = {}) {
  if (!getToken() || syncing) return
  syncing = true
  try {
    let payload = options.location
    if (!payload && options.provinceName) {
      payload = buildLocationPayload(options)
    }
    if (!payload) {
      const effective = getEffectiveLocation()
      payload = buildLocationPayload(effective)
    }
    if (!payload) {
      const stored = getStoredProvince()
      if (stored) {
        payload = buildLocationPayload({ provinceName: stored })
      }
    }
    if (payload?.provinceName) {
      await syncUserLocation(payload)
    }
  } catch (err) {
    console.warn('同步用户定位失败', err)
  } finally {
    syncing = false
  }
}

/** @deprecated 使用 syncLocationToServer */
export const syncProvinceToServer = syncLocationToServer
