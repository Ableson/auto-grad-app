import { syncUserLocation } from '@/api/userCenter'
import { getToken } from '@/utils/auth'
import {
  buildLocationPayload,
  getEffectiveLocation,
  resolveCurrentProvince
} from '@/utils/location'

let syncing = false

/** 登录/定位后将完整位置同步到服务端 */
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
      const resolved = await resolveCurrentProvince({ allowManual: false })
      payload = buildLocationPayload(resolved)
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
