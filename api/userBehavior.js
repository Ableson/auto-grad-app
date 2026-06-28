import request from '@/utils/request'

/** 查询是否已收藏 */
export function checkFavorite(dataId) {
  return request({
    url: '/house/user/behavior/favorite/check',
    method: 'get',
    params: { dataId }
  })
}

/** 切换收藏状态 */
export function toggleFavorite(data) {
  return request({
    url: '/house/user/behavior/favorite/toggle',
    method: 'post',
    data
  })
}

/** 收藏列表 */
export function getFavoriteList() {
  return request({
    url: '/house/user/behavior/favorite/list',
    method: 'get'
  })
}

/** 浏览足迹列表 */
export function getBrowseList() {
  return request({
    url: '/house/user/behavior/browse/list',
    method: 'get'
  })
}
