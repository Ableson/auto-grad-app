<template>
  <view class="order-page">
    <view v-if="loading && !orderList.length" class="empty-tip">加载中...</view>
    <view v-else-if="!orderList.length" class="empty-tip">暂无充值记录</view>
    <view v-else class="order-list">
      <view v-for="item in orderList" :key="item.id || item.orderNo" class="order-card">
        <view class="order-head">
          <text class="plan-name">{{ item.planName || '会员套餐' }}</text>
          <text class="status-tag" :class="statusClass(item.status)">{{ item.statusLabel || statusText(item.status) }}</text>
        </view>
        <view class="order-row">
          <text class="label">订单号</text>
          <text class="value">{{ item.orderNo }}</text>
        </view>
        <view class="order-row">
          <text class="label">金额</text>
          <text class="amount">¥{{ formatAmount(item.amount) }}</text>
        </view>
        <view class="order-row">
          <text class="label">下单时间</text>
          <text class="value">{{ formatTime(item.createTime) }}</text>
        </view>
        <view v-if="item.payTime" class="order-row">
          <text class="label">支付时间</text>
          <text class="value">{{ formatTime(item.payTime) }}</text>
        </view>
      </view>
    </view>

    <view v-if="loadingMore" class="load-more-tip">加载中...</view>
    <view v-else-if="!hasMore && orderList.length" class="load-more-tip">没有更多了</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import { getMemberOrderPage } from '@/api/member'
import { getToken } from '@/utils/auth'

const orderList = ref([])
const pageNum = ref(1)
const pageSize = 10
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)

const hasMore = computed(() => orderList.value.length < total.value)

onLoad(() => {
  if (!getToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login' }), 500)
    return
  }
  reloadList()
})

onReachBottom(() => {
  if (hasMore.value && !loadingMore.value) {
    loadMore()
  }
})

function statusText(status) {
  if (status === '1') return '已支付'
  if (status === '2') return '已关闭'
  return '待支付'
}

function statusClass(status) {
  if (status === '1') return 'paid'
  if (status === '2') return 'closed'
  return 'pending'
}

function formatAmount(amount) {
  const num = Number(amount || 0)
  return num.toFixed(2)
}

function formatTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}

function reloadList() {
  pageNum.value = 1
  orderList.value = []
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
    const res = await getMemberOrderPage({
      pageNum: pageNum.value,
      pageSize
    })
    const payload = res.data || res
    const rows = payload.rows || []
    total.value = payload.total || 0
    orderList.value = append ? orderList.value.concat(rows) : rows
  } catch (err) {
    console.error('加载充值记录失败', err)
    if (!append) {
      orderList.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  pageNum.value += 1
  fetchList(true)
}
</script>

<style scoped>
.order-page {
  min-height: 100vh;
  background: #f5f6f7;
  padding: 24rpx;
  box-sizing: border-box;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.order-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
}

.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.plan-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.status-tag {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
}

.status-tag.paid {
  color: #18bc37;
  background: #eef9f0;
}

.status-tag.pending {
  color: #ff9900;
  background: #fff7e8;
}

.status-tag.closed {
  color: #999;
  background: #f0f0f0;
}

.order-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 14rpx;
}

.label {
  flex-shrink: 0;
  font-size: 26rpx;
  color: #999;
}

.value {
  flex: 1;
  text-align: right;
  font-size: 26rpx;
  color: #555;
  word-break: break-all;
}

.amount {
  font-size: 30rpx;
  font-weight: 700;
  color: #e64340;
}

.empty-tip,
.load-more-tip {
  padding: 80rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}
</style>
