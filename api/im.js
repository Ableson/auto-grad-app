import request from '@/utils/request'

export function getImUnreadCount() {
  return request({ url: '/im/unread/count', method: 'get' })
}

export function getImInbox() {
  return request({ url: '/im/inbox', method: 'get' })
}

export function getImConversationList() {
  return request({ url: '/im/conversation/list', method: 'get' })
}

export function getImMessageList(conversationId, beforeId, limit = 20) {
  return request({
    url: '/im/message/list',
    method: 'get',
    params: { conversationId, beforeId, limit }
  })
}

export function sendImMessage(data) {
  return request({ url: '/im/message/send', method: 'post', data })
}

export function acceptImRequest(id) {
  return request({ url: `/im/request/${id}/accept`, method: 'post' })
}

export function rejectImRequest(id) {
  return request({ url: `/im/request/${id}/reject`, method: 'post' })
}

export function readImConversation(id) {
  return request({ url: `/im/conversation/${id}/read`, method: 'post' })
}

export function startImCall(data) {
  return request({ url: '/im/call/start', method: 'post', data })
}

export function getRingingCall() {
  return request({ url: '/im/call/ringing', method: 'get' })
}

export function getCallCredentials(callId) {
  return request({ url: `/im/call/${callId}/credentials`, method: 'get' })
}

export function acceptImCall(id) {
  return request({ url: `/im/call/${id}/accept`, method: 'post' })
}

export function rejectImCall(id) {
  return request({ url: `/im/call/${id}/reject`, method: 'post' })
}

export function endImCall(id) {
  return request({ url: `/im/call/${id}/end`, method: 'post' })
}
