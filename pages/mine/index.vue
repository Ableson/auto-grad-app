<template>
  <view class="mine-page">
    <view class="profile-section">
      <view class="profile-main">
        <view class="avatar-wrap" @click="handleAvatarClick">
          <image v-if="avatar" :src="avatar" class="avatar" mode="aspectFill"></image>
          <view v-else class="avatar avatar-placeholder">
            <uni-icons type="person-filled" size="36" color="#ccc"></uni-icons>
          </view>
          <view v-if="memberActive" class="crown-badge">
            <uni-icons type="vip-filled" size="14" color="#2979ff"></uni-icons>
          </view>
        </view>

        <view class="profile-info">
          <view v-if="!loggedIn" class="login-row" @click="handleToLogin">
            <text class="login-text">点击登录</text>
          </view>
          <template v-else>
            <view class="name-row">
              <text class="nickname" :class="{ 'nickname-vip': memberActive }">{{ displayName }}</text>
              <view class="edit-name" @click.stop="handleEditName">
                <uni-icons type="compose" size="16" color="#999"></uni-icons>
              </view>
            </view>
            <view v-if="memberActive" class="member-tag">
              <text>{{ memberLabel }}</text>
            </view>
            <view v-else class="member-tag member-tag-normal">
              <text>普通用户</text>
            </view>
            <view v-if="needBindPhone" class="phone-tip" @click.stop="handleToEditInfo">
              请完善手机号
            </view>
          </template>
        </view>

        <view class="space-entry" @click="handleToSpace">
          <text>空间</text>
          <uni-icons type="right" size="14" color="#999"></uni-icons>
        </view>
      </view>

      <view class="stats-row">
        <view class="stat-item" @click="handleProvinceListings">
          <text class="stat-num">{{ stats.dynamicCount || stats.provinceListingCount || 0 }}</text>
          <text class="stat-label">动态</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="handleToFavorite">
          <text class="stat-num">{{ stats.favoriteCount || 0 }}</text>
          <text class="stat-label">关注</text>
        </view>
      </view>
    </view>

    <view class="member-banner" @click="handleToMember">
      <view class="banner-left">
        <text class="banner-title">会员中心</text>
        <text class="banner-desc">解锁法拍原站链接等高级权益</text>
      </view>
      <view class="banner-btn">立即开通</view>
    </view>

    <view v-if="loggedIn" class="order-entry" @click="handleToOrder">
      <text class="order-entry-text">充值记录</text>
      <uni-icons type="right" size="14" color="#999"></uni-icons>
    </view>

    <view class="menu-list">
      <view class="menu-item" @click="handleToWork">
        <view class="menu-item-left">
          <uni-icons type="gear-filled" size="20" color="#2979ff"></uni-icons>
          <text class="menu-item-text">工作台</text>
        </view>
        <uni-icons type="right" size="14" color="#999"></uni-icons>
      </view>
    </view>

    <view class="quick-row">
      <view class="quick-item" @click="handleToBrowse">
        <view class="quick-icon browse">
          <uni-icons type="loop" size="28" color="#2979ff"></uni-icons>
        </view>
        <text class="quick-text">浏览足迹</text>
      </view>
      <view class="quick-item" @click="handleToFavorite">
        <view class="quick-icon favorite">
          <uni-icons type="star-filled" size="28" color="#2979ff"></uni-icons>
        </view>
        <text class="quick-text">我的收藏</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useUserStore } from '@/store'
import { computed, ref, getCurrentInstance } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getToken } from '@/utils/auth'
import { getUserCenterStats } from '@/api/userCenter'
import { refreshMemberStatus, isMember, getMemberDisplayText } from '@/utils/member'
import { syncLocationToServer } from '@/utils/userLocation'

const { proxy } = getCurrentInstance()
const userStore = useUserStore()

const stats = ref({
  provinceListingCount: 0,
  dynamicCount: 0,
  favoriteCount: 0,
  browseCount: 0,
  provinceName: '',
  dynamicFilter: {},
  recentDays: 7
})
const memberActive = ref(false)
const memberLabel = ref('会员')

const loggedIn = computed(() => !!getToken())
const name = computed(() => userStore.name)
const avatar = computed(() => userStore.avatar)

function hasBoundPhone(phone) {
  return /^1\d{10}$/.test(phone || '')
}

const needBindPhone = computed(() => loggedIn.value && !hasBoundPhone(userStore.phone))

const displayName = computed(() => {
  const value = name.value || ''
  if (/^1\d{10}$/.test(value)) {
    return value.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
  }
  return value || '用户'
})

async function refreshPage() {
  if (!loggedIn.value) {
    memberActive.value = false
    stats.value = { provinceListingCount: 0, favoriteCount: 0, browseCount: 0, provinceName: '' }
    return
  }
  try {
    await userStore.getInfo()
    await syncLocationToServer()
    await refreshMemberStatus()
    memberActive.value = isMember()
    memberLabel.value = getMemberDisplayText()
    const res = await getUserCenterStats()
    const data = res.data || res
    stats.value = {
      dynamicCount: data.dynamicCount || data.provinceListingCount || 0,
      provinceListingCount: data.provinceListingCount || data.dynamicCount || 0,
      favoriteCount: data.favoriteCount || 0,
      browseCount: data.browseCount || 0,
      provinceName: data.provinceName || '',
      dynamicFilter: data.dynamicFilter || {},
      recentDays: data.recentDays || 7
    }
  } catch (err) {
    console.warn('刷新我的页失败', err)
  }
}

onShow(() => {
  refreshPage()
})

function handleToLogin() {
  proxy.$tab.reLaunch('/pages/login')
}

function handleAvatarClick() {
  if (!loggedIn.value) {
    handleToLogin()
    return
  }
  proxy.$tab.navigateTo('/pages/mine/avatar/index')
}

function handleEditName() {
  proxy.$tab.navigateTo('/pages/mine/info/edit')
}

function handleToInfo() {
  proxy.$tab.navigateTo('/pages/mine/info/index')
}

function handleToSpace() {
  if (!loggedIn.value) {
    handleToLogin()
    return
  }
  proxy.$tab.navigateTo('/pages/mine/space/index')
}

function handleToEditInfo() {
  proxy.$tab.navigateTo('/pages/mine/info/edit')
}

function handleToFavorite() {
  if (!loggedIn.value) {
    handleToLogin()
    return
  }
  proxy.$tab.navigateTo('/pages/mine/behavior/index?type=favorite')
}

function handleToBrowse() {
  if (!loggedIn.value) {
    handleToLogin()
    return
  }
  proxy.$tab.navigateTo('/pages/mine/behavior/index?type=browse')
}

function handleToMember() {
  if (!loggedIn.value) {
    handleToLogin()
    return
  }
  proxy.$tab.navigateTo('/pages/member/index')
}

function handleToOrder() {
  if (!loggedIn.value) {
    handleToLogin()
    return
  }
  proxy.$tab.navigateTo('/pages/mine/order/index')
}

function handleToWork() {
  proxy.$tab.navigateTo('/pages/work/index')
}

function handleProvinceListings() {
  if (!loggedIn.value) {
    handleToLogin()
    return
  }
  const province = stats.value.provinceName
  if (province) {
    uni.switchTab({ url: '/pages/index' })
  } else {
    proxy.$modal.showToast('请先允许定位或选择省份')
  }
}
</script>

<style lang="scss" scoped>
page {
  background: #f4f4f4;
}

.mine-page {
  min-height: 100vh;
  padding-bottom: 40rpx;
}

.top-bar {
  padding: 16rpx 24rpx 0;
  display: flex;
  justify-content: flex-end;
}

.icon-btn {
  padding: 8rpx;
}

.profile-section {
  background: #fff;
  margin: 0 0 20rpx;
  padding: 0 24rpx 24rpx;
}

.profile-main {
  display: flex;
  align-items: flex-start;
  padding-top: 8rpx;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: #f0f0f0;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.crown-badge {
  position: absolute;
  right: -4rpx;
  top: -4rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #fff;
  border: 2rpx solid #2979ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-info {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
  padding-top: 8rpx;
}

.login-text {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  max-width: 320rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nickname-vip {
  color: #2979ff;
}

.edit-name {
  padding: 4rpx;
}

.member-tag {
  display: inline-block;
  margin-top: 10rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  background: #eef4ff;
  font-size: 22rpx;
  color: #2979ff;
  line-height: 1.4;
  max-width: 420rpx;
}

.member-tag-normal {
  background: #f5f5f5;
  color: #999;
}

.phone-tip {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #ff9900;
}

.space-entry {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding-top: 16rpx;
  font-size: 26rpx;
  color: #666;
}

.stats-row {
  display: flex;
  align-items: center;
  margin-top: 32rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
}

.stat-label {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #999;
}

.stat-divider {
  width: 1rpx;
  height: 48rpx;
  background: #eee;
}

.member-banner {
  margin: 0 24rpx 20rpx;
  padding: 28rpx 24rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #5cadff, #2979ff);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.banner-left {
  display: flex;
  flex-direction: column;
}

.banner-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
}

.banner-desc {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
}

.banner-btn {
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  background: #fff;
  color: #2979ff;
  font-size: 24rpx;
  font-weight: 600;
}

.order-entry {
  margin: 0 24rpx 20rpx;
  padding: 24rpx 28rpx;
  background: #fff;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order-entry-text {
  font-size: 28rpx;
  color: #333;
}

.menu-list {
  margin: 0 24rpx 20rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
}

.menu-item-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.menu-item-text {
  font-size: 28rpx;
  color: #333;
}

.quick-row {
  margin: 0 24rpx;
  padding: 32rpx 40rpx;
  background: #fff;
  border-radius: 20rpx;
  display: flex;
  justify-content: space-around;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quick-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
  background: #f5f8ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-text {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #666;
}
</style>
