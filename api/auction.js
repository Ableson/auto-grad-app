import request from '@/utils/request'
import { isLoggedIn } from '@/utils/auth'

/** 查询拍卖标的列表（支持 provinceName / searchValue；已登录时携带 token 以便记录搜索历史） */
export function listAuction(query) {
  const cfg = {
    url: '/house/auction/list',
    method: 'get',
    params: query
  }
  if (!isLoggedIn()) {
    cfg.headers = { isToken: false }
  }
  return request(cfg)
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

/** 获取解密后的法拍链接（是否需会员由后端按 auction_link 套餐配置决定） */
export function getAuctionLink(dataId) {
  const cfg = {
    url: '/house/auction/member/link/' + dataId,
    method: 'get'
  }
  if (!isLoggedIn()) {
    cfg.headers = { isToken: false }
  }
  return request(cfg)
}

/** 地图页：某省范围内、中心点半径内的房源（含 markers 与分页 rows） */
export function listAuctionNearby(query) {
  return request({
    url: '/house/auction/map/nearby',
    method: 'get',
    params: query,
    headers: {
      isToken: false
    }
  })
}
