import request from '@/utils/request'

/** 查询拍卖标的列表（支持 provinceName / searchValue；已登录时携带 token 以便记录搜索历史） */
export function listAuction(query) {
  return request({
    url: '/house/auction/list',
    method: 'get',
    params: query
  })
}

/** 查询拍卖标的详情 */
export function getAuction(id) {
  return request({
    url: '/house/auction/' + id,
    method: 'get'
  })
}

/** 根据 dataId 查询标的基础公开信息（不含 detailUrl，含 hasAuctionLink） */
export function getAuctionByDataId(dataId) {
  return request({
    url: '/house/auction/getDataId/' + dataId,
    method: 'get',
    headers: {
      isToken: false
    }
  })
}

/** 会员专享：获取解密后的法拍链接（需登录且为会员） */
export function getAuctionLink(dataId) {
  return request({
    url: '/house/auction/member/link/' + dataId,
    method: 'get'
  })
}
