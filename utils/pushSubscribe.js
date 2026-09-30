import { getToken } from '@/utils/auth'
import { reportPushSubscribe, getPushTemplates } from '@/api/push'

let cachedTemplateIds = null

export function setPushTemplateIds(ids = {}) {
  cachedTemplateIds = {
    agency: ids.agency || ids.pushAgencyTemplateId || '',
    user: ids.user || ids.pushUserTemplateId || ''
  }
}

async function loadTemplateIds() {
  if (cachedTemplateIds) {
    return cachedTemplateIds
  }
  try {
    const res = await getPushTemplates()
    const data = res.data || res || {}
    setPushTemplateIds({
      agency: data.agencyTemplateId,
      user: data.userTemplateId
    })
  } catch (e) {
    cachedTemplateIds = { agency: '', user: '' }
  }
  return cachedTemplateIds
}

/**
 * 请求微信订阅授权并上报后端
 * @param {{ agency?: boolean, user?: boolean }} options
 */
export async function requestListingPushSubscribe(options = {}) {
  if (!getToken()) return
  // #ifndef MP-WEIXIN
  return
  // #endif
  const ids = await loadTemplateIds()
  const tmplIds = []
  if (options.agency !== false && ids.agency) tmplIds.push(ids.agency)
  if (options.user !== false && ids.user) tmplIds.push(ids.user)
  if (!tmplIds.length) return

  return new Promise((resolve) => {
    uni.requestSubscribeMessage({
      tmplIds,
      success: async (res) => {
        try {
          await reportPushSubscribe({ results: res })
        } catch (e) {
          /* ignore */
        }
        resolve(res)
      },
      fail: () => resolve(null)
    })
  })
}
