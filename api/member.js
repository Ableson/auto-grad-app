import request from '@/utils/request'

/** 查询当前用户会员状态 */
export function getMemberStatus() {
  return request({
    url: '/house/member/status',
    method: 'get'
  })
}

/** 开通会员（占位，后期对接支付） */
export function purchaseMember() {
  return request({
    url: '/house/member/purchase',
    method: 'post'
  })
}
