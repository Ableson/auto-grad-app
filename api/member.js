import request from '@/utils/request'

/** 查询当前用户会员状态 */
export function getMemberStatus() {
  return request({
    url: '/house/member/status',
    method: 'get'
  })
}

/** 会员套餐列表 */
export function getMemberPlans() {
  return request({
    url: '/house/member/plan/list',
    method: 'get'
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
