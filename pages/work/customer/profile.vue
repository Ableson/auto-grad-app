<template>
  <view class="profile-page">
    <view v-if="pageLoading" class="empty-tip">加载中...</view>
    <template v-else-if="profile">
      <view class="user-card">
        <view class="user-name">{{ displayName }}</view>
        <view class="user-meta">用户ID：{{ profile.userId }}</view>
        <view v-if="profile.phonenumber" class="user-meta">手机：{{ maskPhone(profile.phonenumber) }}</view>
        <view class="claim-row">
          <text v-if="isClaimed" class="claim-tag active">本机构已认领</text>
          <text v-else-if="isClaimPending" class="claim-tag pending">等待用户同意</text>
          <text v-else class="claim-tag">未认领</text>
          <text class="claim-count">共 {{ profile.claimAgencyCount || 0 }} 家机构认领</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">搜索概况</view>
        <view class="stat-grid">
          <view class="stat-item">
            <text class="stat-num">{{ profile.totalSearchCount || 0 }}</text>
            <text class="stat-label">总搜索</text>
          </view>
          <view class="stat-item">
            <text class="stat-num small">{{ formatTime(profile.firstSearchTime) }}</text>
            <text class="stat-label">首次搜索</text>
          </view>
          <view class="stat-item">
            <text class="stat-num small">{{ formatTime(profile.lastSearchTime) }}</text>
            <text class="stat-label">最近搜索</text>
          </view>
        </view>
      </view>

      <view v-if="profile.topKeywords?.length" class="section">
        <view class="section-title">常搜关键词</view>
        <view class="tag-list">
          <text v-for="(kw, idx) in profile.topKeywords" :key="'kw-' + idx" class="tag">{{ kw }}</text>
        </view>
      </view>

      <view v-if="profile.topProvinces?.length" class="section">
        <view class="section-title">关注省份</view>
        <view class="tag-list">
          <text v-for="(p, idx) in profile.topProvinces" :key="'p-' + idx" class="tag">{{ p }}</text>
        </view>
      </view>

      <view v-if="profile.topCities?.length" class="section">
        <view class="section-title">关注城市</view>
        <view class="tag-list">
          <text v-for="(c, idx) in profile.topCities" :key="'c-' + idx" class="tag">{{ c }}</text>
        </view>
      </view>

      <view v-if="hasBrowsePriceStats" class="section">
        <view class="section-title">浏览标的区间</view>
        <view class="price-grid">
          <view class="price-item">
            <text class="price-label">最低起拍价</text>
            <text class="price-value">{{ formatYuan(profile.minStartPriceYuan) }}</text>
          </view>
          <view class="price-item">
            <text class="price-label">最高起拍价</text>
            <text class="price-value">{{ formatYuan(profile.maxStartPriceYuan) }}</text>
          </view>
          <view class="price-item">
            <text class="price-label">最低保证金</text>
            <text class="price-value">{{ formatYuan(profile.minDepositYuan) }}</text>
          </view>
          <view class="price-item">
            <text class="price-label">最高保证金</text>
            <text class="price-value">{{ formatYuan(profile.maxDepositYuan) }}</text>
          </view>
        </view>
      </view>

      <view v-if="profile.recentLogs?.length" class="section">
        <view class="section-title">最近搜索记录</view>
        <view v-for="log in profile.recentLogs" :key="log.id" class="log-item">
          <view class="log-keyword">{{ log.keyword || log.dataId || '（无关键词）' }}</view>
          <view v-if="log.startPriceYuan || log.depositYuan" class="log-price">
            <text v-if="log.startPriceYuan">起拍 {{ formatYuan(log.startPriceYuan) }}</text>
            <text v-if="log.depositYuan"> · 保证金 {{ formatYuan(log.depositYuan) }}</text>
          </view>
          <view class="log-meta">
            {{ [log.provinceName, log.cityName, log.districtName].filter(Boolean).join(' ') }}
            · {{ formatTime(log.searchTime) }}
          </view>
        </view>
      </view>

      <view class="action-bar">
        <button
          v-if="canClaim"
          class="claim-btn"
          :loading="claiming"
          @click="handleClaim"
        >认领客户</button>
        <view v-else-if="isClaimPending" class="claim-btn disabled">等待用户同意</view>
        <view v-else class="claim-btn disabled">已认领</view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getToken } from '@/utils/auth'
import { getAgencyCustomerProfile, claimAgencyCustomer } from '@/api/agency'

const userId = ref(null)
const profile = ref(null)
const pageLoading = ref(false)
const claiming = ref(false)

const displayName = computed(() => {
  if (!profile.value) return '用户'
  if (profile.value.nickName) return profile.value.nickName
  return `用户${profile.value.userId}`
})

const hasBrowsePriceStats = computed(() => {
  if (!profile.value) return false
  return profile.value.minStartPriceYuan != null
    || profile.value.maxStartPriceYuan != null
    || profile.value.minDepositYuan != null
    || profile.value.maxDepositYuan != null
})

const isClaimed = computed(() => !!profile.value?.claimedByMyAgency)
const claimRequireApproval = computed(() => profile.value?.claimRequireUserApproval !== false)
const isClaimPending = computed(() => claimRequireApproval.value && !!profile.value?.claimPendingByMyAgency)
const canClaim = computed(() => !isClaimed.value && !isClaimPending.value)

onLoad((options) => {
  if (!getToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login' }), 500)
    return
  }
  userId.value = options.userId
  loadProfile()
})

onShow(() => {
  if (userId.value && getToken() && profile.value) {
    loadProfile({ silent: true })
  }
})

function parseData(res) {
  return res?.data ?? res ?? {}
}

function applyProfileData(res) {
  const raw = parseData(res)
  profile.value = {
    ...raw,
    claimedByMyAgency: !!raw.claimedByMyAgency,
    claimPendingByMyAgency: !!raw.claimPendingByMyAgency,
    claimRequireUserApproval: raw.claimRequireUserApproval !== false
  }
}

function applyClaimState(res) {
  const raw = parseData(res)
  if (!profile.value) return
  profile.value = {
    ...profile.value,
    claimedByMyAgency: !!raw.claimedByMyAgency,
    claimPendingByMyAgency: !!raw.claimPendingByMyAgency,
    myAgencyClaimStatus: raw.myAgencyClaimStatus,
    claimRequireUserApproval: raw.claimRequireUserApproval !== false
  }
}

function maskPhone(phone) {
  if (!/^1\d{10}$/.test(phone || '')) return phone || '-'
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

function formatTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}

function formatYuan(value) {
  if (value == null || value === '') return '-'
  const num = Number(value)
  if (Number.isNaN(num)) return '-'
  if (num >= 10000) {
    return `${(num / 10000).toFixed(2)} 万`
  }
  return `${num.toLocaleString()} 元`
}

async function loadProfile(options = {}) {
  if (!userId.value) return
  const silent = !!options.silent
  if (!silent && !profile.value) {
    pageLoading.value = true
  }
  try {
    const res = await getAgencyCustomerProfile(userId.value)
    applyProfileData(res)
  } catch (err) {
    if (!silent) {
      uni.showToast({ title: err.msg || '加载失败', icon: 'none' })
    }
  } finally {
    pageLoading.value = false
  }
}

async function handleClaim() {
  if (claiming.value || !userId.value || !canClaim.value) return
  claiming.value = true
  try {
    const res = await claimAgencyCustomer(userId.value, {})
    applyClaimState(res)
    const requireApproval = profile.value?.claimRequireUserApproval !== false
    uni.showToast({
      title: requireApproval ? '申请已发送，等待用户同意' : '认领成功',
      icon: 'success'
    })
    await loadProfile({ silent: true })
  } catch (err) {
    uni.showToast({ title: err.msg || err.message || '认领失败', icon: 'none' })
  } finally {
    claiming.value = false
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: #f4f4f4;
  padding-bottom: 160rpx;
}

.user-card {
  background: #fff;
  padding: 32rpx 24rpx;
  margin-bottom: 20rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.user-meta {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #666;
}

.claim-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 20rpx;
}

.claim-tag {
  font-size: 22rpx;
  color: #999;
  background: #f5f5f5;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.claim-tag.active {
  color: #2979ff;
  background: #eef4ff;
}

.claim-tag.pending {
  color: #e6a23c;
  background: #fdf6ec;
}

.claim-count {
  font-size: 24rpx;
  color: #999;
}

.section {
  background: #fff;
  margin-bottom: 20rpx;
  padding: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.stat-grid {
  display: flex;
  gap: 16rpx;
}

.stat-item {
  flex: 1;
  background: #f8faff;
  border-radius: 12rpx;
  padding: 20rpx 12rpx;
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #2979ff;
}

.stat-num.small {
  font-size: 22rpx;
  font-weight: 500;
  color: #333;
}

.stat-label {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  font-size: 24rpx;
  color: #2979ff;
  background: #eef4ff;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.price-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.price-item {
  background: #f8faff;
  border-radius: 12rpx;
  padding: 20rpx 16rpx;
}

.price-label {
  display: block;
  font-size: 22rpx;
  color: #999;
}

.price-value {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #2979ff;
}

.log-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.log-item:last-child {
  border-bottom: none;
}

.log-keyword {
  font-size: 28rpx;
  color: #333;
}

.log-price {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #2979ff;
}

.log-meta {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #999;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.claim-btn {
  background: #2979ff;
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
}

.claim-btn.disabled {
  background: #ccc;
  color: #fff;
  text-align: center;
  line-height: 88rpx;
  pointer-events: none;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 80rpx 0;
}
</style>
