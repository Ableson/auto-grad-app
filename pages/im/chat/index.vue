<template>
  <view class="chat-page">
    <scroll-view scroll-y class="msg-list" :scroll-into-view="scrollIntoView">
      <view
        v-for="msg in messages"
        :key="msg.id"
        :id="'msg-' + msg.id"
        class="msg-row"
        :class="{
          mine: msg.senderId === myUserId && msg.msgType !== '9',
          system: msg.msgType === '9'
        }"
      >
        <image
          v-if="msg.msgType !== '9' && msg.senderId !== myUserId"
          :src="resolveAvatar(messageAvatar(msg))"
          class="msg-avatar"
          :class="{ clickable: canOpenPeerProfile }"
          mode="aspectFill"
          @click.stop="openPeerProfile"
        />
        <view class="bubble" :class="{ 'call-bubble': isCallMsg(msg.msgType) }" @click="onCallMsgClick(msg)">
          <text v-if="msg.msgType === '9'" class="system-text">{{ msg.content }}</text>
          <text v-else-if="isCallMsg(msg.msgType)" class="call-text">{{ formatCallText(msg) }}</text>
          <text v-else>{{ msg.content }}</text>
        </view>
        <image
          v-if="msg.msgType !== '9' && msg.senderId === myUserId"
          :src="resolveAvatar(messageAvatar(msg))"
          class="msg-avatar"
          mode="aspectFill"
        />
      </view>
    </scroll-view>

    <view class="toolbar">
      <view class="tool-group">
        <view class="tool-btn" @click="handleVoiceCall">
          <uni-icons type="phone-filled" size="20" color="#2979ff"></uni-icons>
        </view>
        <view class="tool-btn" @click="handleVideoCall">
          <uni-icons type="videocam-filled" size="20" color="#2979ff"></uni-icons>
        </view>
      </view>
      <input v-model="inputText" class="input" confirm-type="send" @confirm="handleSend" placeholder="输入消息" />
      <button class="send-btn" size="mini" type="primary" @click="handleSend">发送</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from 'vue'
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
import config from '@/config'
import defAva from '@/static/images/profile.jpg'

const baseUrl = config.baseUrl

const { proxy } = getCurrentInstance()
const userStore = useUserStore()
const myUserId = ref(Number(userStore.id) || 0)
const conversationId = ref(null)
const peerUserId = ref(null)
const peerName = ref('')
const peerAvatar = ref('')
const myAvatar = ref(userStore.avatar || '')
const messages = ref([])
const inputText = ref('')
const scrollIntoView = ref('')
let pollTimer = null
let ringTimer = null
let incomingCallId = null

const canOpenPeerProfile = computed(() => !!resolvePeerUserId())

onLoad((options) => {
  conversationId.value = Number(options.conversationId)
  peerUserId.value = options.peerUserId ? Number(options.peerUserId) : null
  peerName.value = decodeURIComponent(options.peerName || '聊天')
  peerAvatar.value = decodeURIComponent(options.peerAvatar || '')
  myAvatar.value = userStore.avatar || ''
  uni.setNavigationBarTitle({ title: peerName.value })
})

function resolveAvatar(avatar) {
  if (!avatar) return defAva
  if (/^https?:\/\//.test(avatar)) return avatar
  return baseUrl + avatar
}

function messageAvatar(msg) {
  if (msg.senderId === myUserId.value) {
    return myAvatar.value
  }
  return peerAvatar.value
}

function resolvePeerUserId() {
  if (peerUserId.value) {
    return peerUserId.value
  }
  const peerMsg = messages.value.find(item => item.senderId && item.senderId !== myUserId.value)
  return peerMsg?.senderId || null
}

function openPeerProfile() {
  const userId = resolvePeerUserId()
  if (!userId) {
    uni.showToast({ title: '无法获取对方信息', icon: 'none' })
    return
  }
  if (userStore.isAgencyStaff) {
    uni.navigateTo({ url: `/pages/work/customer/profile?userId=${userId}` })
    return
  }
  const nickName = encodeURIComponent(peerName.value || '')
  uni.navigateTo({ url: `/pages/im/user/profile?userId=${userId}&nickName=${nickName}` })
}

onShow(() => {
  myAvatar.value = userStore.avatar || ''
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
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.msg-row.mine {
  justify-content: flex-end;
}
.msg-row.system {
  justify-content: center;
}
.msg-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  flex-shrink: 0;
  background: #ddd;
}
.msg-avatar.clickable:active {
  opacity: 0.75;
}
.bubble {
  max-width: calc(100% - 120rpx);
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
.msg-row.system .bubble {
  background: transparent;
  padding: 0;
}
.system-text, .call-text {
  color: #2979ff;
  font-size: 24rpx;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 16rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #f7f7f7;
  border-top: 1rpx solid #e5e5e5;
}
.tool-group {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4rpx;
}
.tool-btn {
  padding: 4rpx;
  flex-shrink: 0;
}
.input {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  line-height: 72rpx;
  background: #fff;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}
.send-btn {
  flex-shrink: 0;
  width: 112rpx;
  min-width: 112rpx;
  height: 72rpx;
  line-height: 72rpx;
  padding: 0;
  margin: 0;
  font-size: 26rpx;
}
</style>
