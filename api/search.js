import request from '@/utils/request'

/** 获取服务端搜索历史（写入在列表搜索时由后端自动完成） */
export function getSearchHistory() {
  return request({
    url: '/house/search/history',
    method: 'get'
  })
}
