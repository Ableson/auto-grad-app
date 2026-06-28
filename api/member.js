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

/** 开通会员（占位，后期对接支付） */
export function purchaseMember(planId) {
  return request({
    url: '/house/member/purchase',
    method: 'post',
    data: planId ? { planId } : {}
  })
}
