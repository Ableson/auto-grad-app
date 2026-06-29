import request from '@/utils/request'

/** 行政区划列表（登录后会话内缓存，勿频繁调用） */
export function getAreaList(params) {
  return request({
    url: '/house/area/list',
    method: 'get',
    params
  })
}
