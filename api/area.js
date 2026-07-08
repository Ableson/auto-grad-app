import request from '@/utils/request'

/** 行政区划列表（会话内缓存，勿频繁调用；未登录可访问） */
export function getAreaList(params) {
  return request({
    url: '/house/area/list',
    method: 'get',
    params,
    headers: {
      isToken: false
    }
  })
}
