<template>
  <view class="chat-page">
    <scroll-view scroll-y class="msg-list" :scroll-into-view="scrollIntoView">
      <view v-for="msg in messages" :key="msg.id" :id="'msg-' + msg.id" class="msg-row" :class="{ mine: msg.senderId === myUserId }">
        <view class="bubble" :class="{ 'call-bubble': isCallMsg(msg.msgType) }" @click="onCallMsgClick(msg)">
          <text v-if="msg.msgType === '9'" class="system-text">{{ msg.content }}</text>
          <text v-else-if="isCallMsg(msg.msgType)" class="call-text">{{ formatCallText(msg) }}</text>
          <text v-else>{{ msg.content }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="toolbar">
      <view class="tool-btn" @click="handleVoiceCall">
        <uni-icons type="phone-filled" size="22" color="#2979ff"></uni-icons>
      </view>
      <view class="tool-btn" @click="handleVideoCall">
        <uni-icons type="videocam-filled" size="22" color="#2979ff"></uni-icons>
      </view>
      <input v-model="inputText" class="input" confirm-type="send" @confirm="handleSend" placeholder="输入消息" />
      <button class="send-btn" size="mini" type="primary" @click="handleSend">发送</button>
    </view>
  </view>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue'
import { onLoad, onShow, onUnload, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/store'
import {
  getImMessageList,
  sendImMessage,
  readImConversation,
  startImCall,
  getRingingCall,
  rejectImCall
} from '@/api/im'

const { proxy } = getCurrentInstance()
const userStore = useUserStore()
const myUserId = ref(Number(userStore.id) || 0)
const conversationId = ref(null)
const peerName = ref('')
const messages = ref([])
const inputText = ref('')
const scrollIntoView = ref('')
let pollTimer = null
let ringTimer = null
let incomingCallId = null

onLoad((options) => {
  conversationId.value = Number(options.conversationId)
  peerName.value = decodeURIComponent(options.peerName || '聊天')
  uni.setNavigationBarTitle({ title: peerName.value })
})

onShow(() => {
  loadMessages()
  readImConversation(conversationId.value).catch(() => {})
  pollTimer = setInterval(loadMessages, 5000)
  ringTimer = setInterval(checkRingingCall, 3000)
  checkRingingCall()
})

onHide(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (ringTimer) clearInterval(ringTimer)
})

onUnload(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (ringTimer) clearInterval(ringTimer)
})

async function loadMessages() {
  if (!conversationId.value) return
  try {
    const res = await getImMessageList(conversationId.value)
    const list = res.data || res || []
    messages.value = list
    if (list.length) {
      scrollIntoView.value = 'msg-' + list[list.length - 1].id
    }
  } catch (e) {}
}

async function handleSend() {
  const text = (inputText.value || '').trim()
  if (!text) return
  try {
    await sendImMessage({ conversationId: conversationId.value, msgType: '1', content: text })
    inputText.value = ''
    loadMessages()
  } catch (e) {}
}

function isCallMsg(type) {
  return type === '4' || type === '5'
}

function parseCallPayload(content) {
  if (!content) return null
  try {
    const obj = JSON.parse(content)
    if (obj && obj.callId) return obj
  } catch (e) {}
  return null
}

function formatCallText(msg) {
  const payload = parseCallPayload(msg.content)
  if (payload?.text) return payload.text
  return msg.msgType === '5' ? '[视频通话邀请]' : '[语音通话邀请]'
}

function goCallRoom(callId, callType, role) {
  const url = `/pages/im/call/room?callId=${callId}&callType=${callType}&role=${role}&peerName=${encodeURIComponent(peerName.value)}`
  proxy.$tab.navigateTo(url)
}

function onCallMsgClick(msg) {
  if (!isCallMsg(msg.msgType) || msg.senderId === myUserId.value) return
  const payload = parseCallPayload(msg.content)
  if (!payload?.callId) return
  uni.showModal({
    title: '来电',
    content: formatCallText(msg),
    confirmText: '接听',
    cancelText: '拒绝',
    success: (res) => {
      if (res.confirm) {
        goCallRoom(payload.callId, payload.callType || (msg.msgType === '5' ? '2' : '1'), 'callee')
      } else if (res.cancel) {
        rejectImCall(payload.callId).catch(() => {})
      }
    }
  })
}

async function checkRingingCall() {
  try {
    const res = await getRingingCall()
    const call = res.data || res
    if (!call || !call.id) return
    if (call.conversationId !== conversationId.value) return
    if (incomingCallId === call.id) return
    incomingCallId = call.id
    uni.showModal({
      title: '来电',
      content: call.callType === '2' ? '视频通话邀请' : '语音通话邀请',
      confirmText: '接听',
      cancelText: '拒绝',
      success: (r) => {
        incomingCallId = null
        if (r.confirm) {
          goCallRoom(call.id, call.callType || '1', 'callee')
        } else if (r.cancel) {
          rejectImCall(call.id).catch(() => {})
        }
      }
    })
  } catch (e) {}
}

async function startCall(callType) {
  try {
    const res = await startImCall({ conversationId: conversationId.value, callType })
    const data = res.data || res
    const trtc = data.trtc
    if (!trtc || !trtc.enabled) {
      proxy.$modal.showToast('TRTC 未配置，请设置 IM_TRTC_ENABLED 等环境变量')
      return
    }
    goCallRoom(data.callId, data.callType || callType, 'caller')
    loadMessages()
  } catch (e) {}
}

function handleVoiceCall() {
  startCall('1')
}

function handleVideoCall() {
  startCall('2')
}
</script>

<style lang="scss" scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ededed;
}
.msg-list {
  flex: 1;
  padding: 24rpx;
  box-sizing: border-box;
}
.msg-row {
  display: flex;
  margin-bottom: 20rpx;
}
.msg-row.mine {
  justify-content: flex-end;
}
.bubble {
  max-width: 70%;
  background: #fff;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
  color: #333;
}
.call-bubble {
  border: 1rpx solid #2979ff;
}
.msg-row.mine .bubble {
  background: #95ec69;
}
.system-text, .call-text {
  color: #2979ff;
  font-size: 24rpx;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  background: #f7f7f7;
  border-top: 1rpx solid #e5e5e5;
}
.tool-btn {
  padding: 8rpx;
}
.input {
  flex: 1;
  background: #fff;
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
  font-size: 28rpx;
}
.send-btn {
  margin: 0;
}
</style>
