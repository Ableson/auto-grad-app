import request from '@/utils/request'

import { getToken } from '@/utils/auth'

/** 查询当前用户会员状态 */
export function getMemberStatus() {
  const cfg = {
    url: '/house/member/status',
    method: 'get'
  }
  if (!getToken()) {
    cfg.headers = { isToken: false }
  }
  return request(cfg)
}

/** 会员套餐列表（可按类型筛选） */
export function getMemberPlans(planType) {
  const cfg = {
    url: '/house/member/plan/list',
    method: 'get'
  }
  if (planType) {
    cfg.params = { planType }
  }
  return request(cfg)
}

/** 查询指定 API 路径的会员访问权限 */
export function getMemberFeatureAccess({ path, method = 'GET', planType } = {}) {
  const cfg = {
    url: '/house/member/feature/access',
    method: 'get',
    params: {}
  }
  if (path) {
    cfg.params.path = path
    cfg.params.method = method
  } else if (planType) {
    cfg.params.planType = planType
  }
  if (!getToken()) {
    cfg.headers = { isToken: false }
  }
  return request(cfg)
}

/** 可配置的保护路径下拉 */
export function getMemberProtectPathOptions() {
  return request({
    url: '/house/member/path/options',
    method: 'get',
    headers: { isToken: false }
  })
}

/** 创建会员支付订单，返回 payParams */
export function createMemberPayOrder(planId) {
  return request({
    url: '/house/member/pay/prepay',
    method: 'post',
    data: { planId }
  })
}

/** 查询会员支付订单状态 */
export function queryMemberPayOrder(orderNo) {
  return request({
    url: '/house/member/pay/status',
    method: 'get',
    params: { orderNo }
  })
}

/** 我的充值记录（分页） */
export function getMemberOrderPage(params) {
  return request({
    url: '/house/member/order/my/page',
    method: 'get',
    params
  })
}

/** 开通会员（0 元或体验环境，正式环境请走 createMemberPayOrder） */
export function purchaseMember(planId) {
  return request({
    url: '/house/member/purchase',
    method: 'post',
    data: planId ? { planId } : {}
  })
}
