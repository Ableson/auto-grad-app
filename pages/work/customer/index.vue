<template>
  <view class="customer-page">
    <view v-if="agencyName" class="page-header">
      <text class="header-title">{{ agencyName }}</text>
      <text class="header-sub">客户管理</text>
    </view>

    <view v-if="loading && !customerList.length" class="empty-tip">加载中...</view>
    <view v-else-if="!customerList.length" class="empty-tip">暂无用户搜索记录</view>
    <view v-else class="customer-list">
      <view
        v-for="item in customerList"
        :key="item.userId"
        class="customer-card"
        @click="goProfile(item.userId)"
      >
        <view class="card-main">
          <image
            :src="resolveAvatar(item.avatar)"
            class="avatar"
            mode="aspectFill"
          />
          <view class="card-content">
            <view class="card-head">
              <text class="name">{{ displayName(item) }}</text>
              <text v-if="item.claimed" class="tag claimed">已认领</text>
              <text v-else-if="claimRequireApproval && item.claimPending" class="tag pending">等待用户同意</text>
              <text v-else class="tag">未认领</text>
            </view>
            <view class="card-row">
              <text class="label">最近搜索</text>
              <text class="value">{{ item.lastKeyword || '-' }}</text>
            </view>
            <view class="card-row">
              <text class="label">地区</text>
              <text class="value">{{ regionText(item) }}</text>
            </view>
            <view class="card-row">
              <text class="label">搜索次数</text>
              <text class="value">{{ item.searchCount || 0 }} 次</text>
            </view>
            <view class="card-row">
              <text class="label">认领机构数</text>
              <text class="value">{{ item.claimAgencyCount || 0 }}</text>
            </view>
            <view class="card-foot">
              <text class="time">{{ formatTime(item.lastSearchTime) }}</text>
              <text class="link">查看画像 ></text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="loadingMore" class="load-more-tip">加载中...</view>
    <view v-else-if="!hasMore && customerList.length" class="load-more-tip">没有更多了</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onReachBottom, onShow } from '@dcloudio/uni-app'
import { getToken } from '@/utils/auth'
import { getAgencyApplyStatus, getMyAgencyInfo, getAgencyCustomerPage } from '@/api/agency'
import config from '@/config'
import defAva from '@/static/images/profile.jpg'

const baseUrl = config.baseUrl

const agencyName = ref('')
const customerList = ref([])
const pageNum = ref(1)
const pageSize = 10
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const claimRequireApproval = ref(true)

const hasMore = computed(() => customerList.value.length < total.value)

onLoad(async () => {
  if (!getToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login' }), 500)
    return
  }
  const allowed = await ensureAgencyAccess()
  if (allowed) {
    reloadList()
  }
})

onShow(async () => {
  if (getToken()) {
    await loadAgencyInfo()
  }
})

onReachBottom(() => {
  if (hasMore.value && !loadingMore.value) {
    loadMore()
  }
})

async function ensureAgencyAccess() {
  try {
    const res = await getAgencyApplyStatus()
    const data = res.data || res
    if (!data.isAgencyStaff) {
      uni.showModal({
        title: '提示',
        content: data.applyStatus === '0'
          ? '您的入驻申请审核中'
          : '您还不是辅拍机构人员，请先申请入驻',
        showCancel: false,
        success: () => {
          if (data.applyStatus === '0') {
            uni.navigateBack()
          } else {
            uni.redirectTo({ url: '/pages/mine/agency/apply' })
          }
        }
      })
      return false
    }
    return true
  } catch (err) {
    console.warn(err)
    return false
  }
}

async function loadAgencyInfo() {
  try {
    const res = await getMyAgencyInfo()
    const data = res.data || res
    agencyName.value = data.agency?.name || data.agencyName || ''
  } catch (err) {
    console.warn('加载机构信息失败', err)
  }
}

function displayName(item) {
  if (item.nickName) return item.nickName
  const phone = item.phonenumber || ''
  if (/^1\d{10}$/.test(phone)) {
    return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
  }
  return `用户${item.userId}`
}

function resolveAvatar(avatar) {
  if (!avatar) return defAva
  if (/^https?:\/\//.test(avatar)) return avatar
  return baseUrl + avatar
}

function regionText(item) {
  return [item.lastProvince, item.lastCity].filter(Boolean).join(' ') || '-'
}

function formatTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}

function goProfile(userId) {
  uni.navigateTo({ url: `/pages/work/customer/profile?userId=${userId}` })
}

function reloadList() {
  pageNum.value = 1
  customerList.value = []
  total.value = 0
  fetchList()
}

async function fetchList(append = false) {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  try {
    const res = await getAgencyCustomerPage({
      pageNum: pageNum.value,
      pageSize
    })
    const data = res.data || res
    const rows = data.rows || []
    total.value = data.total || 0
    claimRequireApproval.value = data.claimRequireUserApproval !== false
    customerList.value = append ? customerList.value.concat(rows) : rows
  } catch (err) {
    uni.showToast({ title: err.msg || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  pageNum.value += 1
  fetchList(true)
}
</script>

<style lang="scss" scoped>
.customer-page {
  min-height: 100vh;
  background: #f4f4f4;
  padding-bottom: 40rpx;
}

.page-header {
  background: linear-gradient(135deg, #2979ff, #5c9dff);
  padding: 40rpx 32rpx;
  color: #fff;
}

.header-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
}

.header-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

.customer-list {
  padding: 24rpx;
}

.customer-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.card-main {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #f0f0f0;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-head {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.name {
  flex: 1;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.tag {
  font-size: 22rpx;
  color: #999;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.tag.claimed {
  color: #2979ff;
  background: #eef4ff;
}

.tag.pending {
  color: #e6a23c;
  background: #fdf6ec;
}

.card-row {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
  font-size: 26rpx;
}

.label {
  color: #999;
}

.value {
  color: #333;
  max-width: 420rpx;
  text-align: right;
}

.card-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
  font-size: 24rpx;
}

.time {
  color: #999;
}

.link {
  color: #2979ff;
}

.empty-tip,
.load-more-tip {
  text-align: center;
  color: #999;
  font-size: 26rpx;
  padding: 80rpx 0;
}
</style>
