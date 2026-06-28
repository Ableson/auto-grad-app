import request from '@/utils/request'

/** 查询标的详情列表（按 dataId 筛选，与管理端共用 /house/detail/list） */
export function listAuctionDetail(query) {
  return request({
    url: '/house/detail/list',
    method: 'get',
    params: query,
    headers: {
      isToken: false
    }
  })
}

/** 按 dataId 查询详情（GET /house/detail/data/{dataId}，已登录时自动记录浏览足迹） */
export function getAuctionDetailByDataId(dataId, title) {
  return request({
    url: '/house/detail/data/' + dataId,
    method: 'get',
    params: title ? { title } : {}
  })
}
