import request from '@/utils/request'

export function getPushPref() {
  return request({
    url: '/house/push/pref',
    method: 'get'
  })
}

export function updatePushPref(data) {
  return request({
    url: '/house/push/pref',
    method: 'put',
    data
  })
}

export function reportPushSubscribe(data) {
  return request({
    url: '/house/push/subscribe/report',
    method: 'post',
    data
  })
}

export function getPushTemplates() {
  return request({
    url: '/house/push/templates',
    method: 'get'
  })
}
