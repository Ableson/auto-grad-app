import request from '@/utils/request'

/** 查询拍卖标的列表（支持 provinceName 筛选，与管理端共用 /house/auction/list） */
export function listAuction(query) {
  return request({
    url: '/house/auction/list',
    method: 'get',
    params: query,
    headers: {
      isToken: false
    }
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
