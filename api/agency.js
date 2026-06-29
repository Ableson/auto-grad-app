import request from '@/utils/request'

/** 我的入驻/机构身份状态 */
export function getAgencyApplyStatus() {
  return request({
    url: '/house/agency/apply/mine',
    method: 'get'
  })
}

/** 提交辅拍机构入驻申请 */
export function submitAgencyApply(data) {
  return request({
    url: '/house/agency/apply',
    method: 'post',
    data
  })
}

/** 机构人员信息 */
export function getMyAgencyInfo() {
  return request({
    url: '/house/agency/mine',
    method: 'get'
  })
}

/** 机构端用户列表 */
export function getAgencyCustomerPage(params) {
  return request({
    url: '/house/agency/customer/page',
    method: 'get',
    params
  })
}

/** 用户画像 */
export function getAgencyCustomerProfile(userId) {
  return request({
    url: `/house/agency/customer/${userId}/profile`,
    method: 'get'
  })
}

/** 认领客户 */
export function claimAgencyCustomer(userId, data) {
  return request({
    url: `/house/agency/customer/${userId}/claim`,
    method: 'post',
    data
  })
}
