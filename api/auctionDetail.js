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
