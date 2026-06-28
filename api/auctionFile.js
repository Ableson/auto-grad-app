import request from '@/utils/request'

/** 查询标的附件列表（按 dataId 筛选，与管理端共用 /house/file/list） */
export function listAuctionFile(query) {
  return request({
    url: '/house/file/list',
    method: 'get',
    params: query,
    headers: {
      isToken: false
    }
  })
}
