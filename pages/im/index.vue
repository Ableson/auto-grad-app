<template>
  <view v-if="!loggedIn" class="login-gate">
    <uni-icons type="chatboxes" size="64" color="#ccc"></uni-icons>
    <text class="gate-title">登录后查看消息</text>
    <text class="gate-desc">辅拍机构联系、会话记录需登录后使用</text>
    <button class="gate-btn" type="primary" @click="goLogin">去登录</button>
  </view>
  <view v-else class="im-page">
    <view v-if="pendingRequests.length" class="section">
      <view class="section-title">联系申请</view>
      <view v-for="item in pendingRequests" :key="item.id" class="request-card">
        <view class="request-main">
          <image
            :src="resolveAvatar(item.fromAvatar)"
            class="avatar clickable"
            mode="aspectFill"
            @click.stop="openPeerProfile(item)"
          ></image>
          <view class="request-info">
            <text class="request-title">{{ item.title || '辅拍机构' }}</text>
            <text class="request-from">{{ item.fromNickName || '机构人员' }}</text>
            <text class="request-content">{{ item.content || '申请与您建立联系' }}</text>
          </view>
        </view>
        <view class="request-actions">
          <button class="btn reject" size="mini" @click="handleReject(item)">拒绝</button>
          <button class="btn accept" size="mini" type="primary" @click="handleAccept(item)">同意</button>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">会话</view>
      <view v-if="!conversations.length" class="empty">暂无会话</view>
      <view
        v-for="item in conversations"
        :key="item.conversationId"
        class="conv-item"
        @click="openChat(item)"
      >
        <image :src="resolveAvatar(item.peerAvatar)" class="avatar" mode="aspectFill"></image>
        <view class="conv-main">
          <view class="conv-top">
            <text class="conv-name">{{ item.peerNickName || '用户' }}</text>
            <text class="conv-time">{{ formatTime(item.lastMsgTime) }}</text>
          </view>
          <view class="conv-bottom">
            <text class="conv-preview">{{ item.lastMsgPreview || '暂无消息' }}</text>
            <view v-if="item.unreadCount > 0" class="badge">{{ item.unreadCount > 99 ? '...' : item.unreadCount }}</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getImInbox, acceptImRequest, rejectImRequest } from '@/api/im'
import { goLoginFromTab, isLoggedIn } from '@/utils/tabLogin'
import { refreshImTabBadge } from '@/utils/imTabBadge'
import config from '@/config'
import defAva from '@/static/images/profile.jpg'

import { useUserStore } from '@/store'

const baseUrl = config.baseUrl

const { proxy } = getCurrentInstance()
const userStore = useUserStore()
const pendingRequests = ref([])
const conversations = ref([])
const loggedIn = computed(() => isLoggedIn())

onShow(() => {
  if (!loggedIn.value) return
  loadInbox()
})

function goLogin() {
  goLoginFromTab()
}

async function loadInbox() {
  try {
    const res = await getImInbox()
    const data = res.data || res
    pendingRequests.value = data.requests || []
    conversations.value = data.conversations || []
    refreshImTabBadge()
  } catch (e) {
    console.warn('加载消息失败', e)
  }
}

function formatTime(time) {
  if (!time) return ''
  return String(time).replace('T', ' ').slice(0, 16)
}

function resolveAvatar(avatar) {
  if (!avatar) return defAva
  if (/^https?:\/\//.test(avatar)) return avatar
  return baseUrl + avatar
}

function removeRequest(requestId) {
  pendingRequests.value = pendingRequests.value.filter(item => item.id !== requestId)
}

function openPeerProfile(item) {
  const userId = item.fromUserId || item.peerUserId
  if (!userId) {
    uni.showToast({ title: '无法获取对方信息', icon: 'none' })
    return
  }
  if (userStore.isAgencyStaff) {
    uni.navigateTo({ url: `/pages/work/customer/profile?userId=${userId}` })
    return
  }
  const nickName = encodeURIComponent(item.fromNickName || item.peerNickName || '')
  uni.navigateTo({ url: `/pages/im/user/profile?userId=${userId}&nickName=${nickName}` })
}

async function handleAccept(item) {
  try {
    await acceptImRequest(item.id)
    removeRequest(item.id)
    proxy.$modal.showToast('已同意')
    loadInbox()
  } catch (e) {
    loadInbox()
  }
}

async function handleReject(item) {
  try {
    await rejectImRequest(item.id)
    removeRequest(item.id)
    proxy.$modal.showToast('已拒绝')
    loadInbox()
  } catch (e) {
    loadInbox()
  }
}

function openChat(item) {
  proxy.$tab.navigateTo(`/pages/im/chat/index?conversationId=${item.conversationId}&peerUserId=${item.peerUserId}&peerName=${encodeURIComponent(item.peerNickName || '')}&peerAvatar=${encodeURIComponent(item.peerAvatar || '')}`)
}
</script>

<style lang="scss" scoped>
.login-gate {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  background: #f4f4f4;
  box-sizing: border-box;
}
.gate-title {
  margin-top: 32rpx;
  font-size: 34rpx;
  color: #333;
  font-weight: 600;
}
.gate-desc {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #999;
  text-align: center;
}
.gate-btn {
  margin-top: 48rpx;
  width: 320rpx;
  border-radius: 44rpx;
}
.im-page {
  min-height: 100vh;
  background: #f4f4f4;
  padding-bottom: 40rpx;
}
.section {
  margin-top: 20rpx;
}
.section-title {
  padding: 16rpx 24rpx;
  font-size: 26rpx;
  color: #999;
}
.request-card, .conv-item {
  background: #fff;
  margin: 0 24rpx 16rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}
.request-main, .conv-item {
  display: flex;
  align-items: center;
}
.avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  flex-shrink: 0;
}
.avatar.clickable:active {
  opacity: 0.75;
}
.avatar-placeholder {
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.request-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.request-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 600;
}
.request-from, .request-content {
  font-size: 24rpx;
  color: #666;
}
.request-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 20rpx;
}
.btn.reject {
  background: #f5f5f5;
  color: #666;
}
.conv-main {
  flex: 1;
  min-width: 0;
}
.conv-top, .conv-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.conv-name {
  font-size: 30rpx;
  color: #333;
}
.conv-time {
  font-size: 22rpx;
  color: #999;
}
.conv-preview {
  flex: 1;
  font-size: 24rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 8rpx;
}
.badge {
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  background: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  text-align: center;
  margin-left: 12rpx;
}
.empty {
  text-align: center;
  color: #999;
  padding: 60rpx 0;
}
</style>
