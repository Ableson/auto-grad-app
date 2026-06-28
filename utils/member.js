import { getMemberStatus } from '@/api/member'
import { getToken } from '@/utils/auth'

const MEMBER_PAGE = '/pages/member/index'

let memberState = {
  member: false,
  loggedIn: false,
  cachedAt: 0
}

const CACHE_TTL_MS = 5 * 60 * 1000

/** 是否已开通会员（优先读缓存，建议页面 onShow 时调用 refreshMemberStatus） */
export function isMember() {
  if (Date.now() - memberState.cachedAt <= CACHE_TTL_MS) {
    return memberState.member
  }
  return false
}

/** 从服务端刷新会员状态 */
export async function refreshMemberStatus() {
  try {
    const res = await getMemberStatus()
    memberState = {
      member: !!res.member,
      loggedIn: !!res.loggedIn || !!getToken(),
      cachedAt: Date.now()
    }
  } catch (err) {
    memberState = {
      member: false,
      loggedIn: !!getToken(),
      cachedAt: Date.now()
    }
  }
  return memberState.member
}

/** 跳转到会员购买页 */
export function goMemberPurchase(options = {}) {
  const { dataId = '' } = options
  const query = dataId ? `?dataId=${encodeURIComponent(dataId)}` : ''
  uni.navigateTo({
    url: `${MEMBER_PAGE}${query}`
  })
}
