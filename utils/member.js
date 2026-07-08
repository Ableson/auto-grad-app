import { getMemberStatus, getMemberFeatureAccess } from '@/api/member'
import { getToken } from '@/utils/auth'

const MEMBER_PAGE = '/pages/member/index'

/** 与首页菜单统一的主色 */
export const MEMBER_THEME_COLOR = '#2979ff'

let memberState = {
  member: false,
  loggedIn: false,
  planName: '',
  planCode: '',
  planType: '',
  permanent: false,
  expireTime: null,
  cachedAt: 0
}

const featureAccessCache = {}

const CACHE_TTL_MS = 5 * 60 * 1000

/** 是否已开通会员（优先读缓存，建议页面 onShow 时调用 refreshMemberStatus） */
export function isMember() {
  if (Date.now() - memberState.cachedAt <= CACHE_TTL_MS) {
    return memberState.member
  }
  return false
}

export function getMemberPlanName() {
  return memberState.planName || ''
}

export function getMemberPlanCode() {
  return memberState.planCode || ''
}

export function isPermanentMember() {
  return !!memberState.permanent
}

/**
 * 会员套餐名称（原样显示）
 */
export function getMemberDisplayLabel() {
  if (!memberState.member) return ''
  return memberState.planName || '会员'
}

/** 到期时间文案 */
export function getMemberExpireText() {
  if (!memberState.member) return ''
  if (memberState.permanent) return '永久有效'
  if (!memberState.expireTime) return ''
  const dateStr = String(memberState.expireTime).replace('T', ' ').slice(0, 10)
  return `${dateStr}到期`
}

/** 会员名称 + 到期时间（用于页面展示） */
export function getMemberDisplayText() {
  const name = getMemberDisplayLabel()
  if (!name) return ''
  const expire = getMemberExpireText()
  return expire ? `${name} ${expire}` : name
}

export function getMemberExpireTime() {
  return memberState.expireTime || null
}

/** 从服务端刷新会员状态 */
export async function refreshMemberStatus() {
  try {
    const res = await getMemberStatus()
    memberState = {
      member: !!res.member,
      permanent: !!res.permanent,
      planName: res.planName || '',
      planCode: res.planCode || '',
      planType: res.planType || '',
      expireTime: res.expireTime || null,
      loggedIn: !!res.loggedIn || !!getToken(),
      cachedAt: Date.now()
    }
  } catch (err) {
    memberState = {
      member: false,
      permanent: false,
      planName: '',
      planCode: '',
      planType: '',
      expireTime: null,
      loggedIn: !!getToken(),
      cachedAt: Date.now()
    }
  }
  return memberState.member
}

const defaultFeatureAccess = {
  required: false,
  member: false,
  canAccess: true,
  loggedIn: false,
  planType: '',
  pathName: ''
}

function cacheKey(path, method = 'GET') {
  return `${method.toUpperCase()} ${path}`
}

/** 刷新指定 API 路径的会员访问权限 */
export async function refreshFeatureAccessByPath(path, method = 'GET') {
  const key = cacheKey(path, method)
  try {
    const res = await getMemberFeatureAccess({ path, method })
    const data = res.data || res
    featureAccessCache[key] = {
      required: !!data.required,
      member: !!data.member,
      canAccess: data.canAccess !== false,
      loggedIn: !!data.loggedIn || !!getToken(),
      planType: data.planType || '',
      pathName: data.pathName || '',
      pathPattern: data.pathPattern || '',
      cachedAt: Date.now()
    }
  } catch (err) {
    featureAccessCache[key] = {
      ...defaultFeatureAccess,
      loggedIn: !!getToken(),
      cachedAt: Date.now()
    }
  }
  return getFeatureAccessStateByPath(path, method)
}

export function getFeatureAccessStateByPath(path, method = 'GET') {
  const key = cacheKey(path, method)
  const cached = featureAccessCache[key]
  if (cached && Date.now() - cached.cachedAt <= CACHE_TTL_MS) {
    return cached
  }
  return { ...defaultFeatureAccess, loggedIn: !!getToken() }
}

export function isPathMembershipRequired(path, method = 'GET') {
  return !!getFeatureAccessStateByPath(path, method).required
}

export function canAccessPath(path, method = 'GET') {
  return getFeatureAccessStateByPath(path, method).canAccess !== false
}

/** 跳转到会员购买页 */
export function goMemberPurchase(options = {}) {
  const { dataId = '', planType = '', path = '', method = 'GET' } = options
  const queryParts = []
  if (path) {
    queryParts.push(`path=${encodeURIComponent(path)}`)
    queryParts.push(`method=${encodeURIComponent(method)}`)
  } else if (planType) {
    queryParts.push(`planType=${encodeURIComponent(planType)}`)
  }
  if (dataId) {
    queryParts.push(`dataId=${encodeURIComponent(dataId)}`)
  }
  const query = queryParts.length ? `?${queryParts.join('&')}` : ''
  uni.navigateTo({
    url: `${MEMBER_PAGE}${query}`
  })
}
