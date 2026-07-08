<template>
  <view class="info-page">
    <view class="profile-header">
      <image :src="resolveAvatar(user.avatar)" class="avatar" mode="aspectFill" />
      <text class="name">{{ user.nickName || '用户' }}</text>
    </view>

    <uni-section title="个人信息" type="line"></uni-section>
    <view class="profile-card">
      <uni-list>
        <uni-list-item showExtraIcon="true" :extraIcon="{type: 'person-filled'}" title="昵称" :rightText="user.nickName || '-'" />
        <uni-list-item showExtraIcon="true" :extraIcon="{type: 'phone-filled'}" title="手机号码" :rightText="user.phonenumber || '-'" />
        <uni-list-item showExtraIcon="true" :extraIcon="{type: 'email-filled'}" title="邮箱" :rightText="user.email || '-'" />
        <uni-list-item showExtraIcon="true" :extraIcon="{type: 'calendar-filled'}" title="创建日期" :rightText="formatTime(user.createTime)" />
      </uni-list>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getImPeerProfile } from '@/api/im'
import config from '@/config'
import defAva from '@/static/images/profile.jpg'

const baseUrl = config.baseUrl
const user = ref({})

onLoad((options) => {
  const userId = options.userId
  const title = decodeURIComponent(options.nickName || '对方资料')
  uni.setNavigationBarTitle({ title })
  if (userId) {
    loadProfile(userId)
  }
})

async function loadProfile(userId) {
  try {
    const res = await getImPeerProfile(userId)
    user.value = res.data || res || {}
  } catch (e) {
    uni.showToast({ title: e.msg || '加载失败', icon: 'none' })
  }
}

function resolveAvatar(avatar) {
  if (!avatar) return defAva
  if (/^https?:\/\//.test(avatar)) return avatar
  return baseUrl + avatar
}

function formatTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}
</script>

<style lang="scss" scoped>
.info-page {
  min-height: 100vh;
  background: #f5f6f7;
  padding-bottom: 40rpx;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 24rpx 24rpx;
  background: #fff;
  margin-bottom: 20rpx;
}

.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: #f0f0f0;
}

.name {
  margin-top: 20rpx;
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.profile-card {
  margin: 0 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: #fff;
}
</style>
