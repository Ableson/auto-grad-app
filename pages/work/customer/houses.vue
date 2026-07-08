<template>
  <view class="houses-page">
    <view v-if="loading && !houseList.length" class="empty-tip">加载中...</view>
    <view v-else-if="!houseList.length" class="empty-tip">暂无匹配房源</view>
    <view v-else class="house-list">
      <view
        v-for="item in houseList"
        :key="item.id || item.dataId"
        class="house-card"
        @click="openDetail(item)"
      >
        <image
          class="house-cover"
          :src="resolveFileUrl(item.imgPath) || '/static/logo.png'"
          mode="aspectFill"
        />
        <view class="house-info">
          <text class="house-title">{{ item.title }}</text>
          <view class="house-meta">
            <text class="province">{{ item.provinceName }}</text>
            <text class="price">起拍 {{ item.startPrice }} 万</text>
          </view>
          <view class="time-row">
            <text class="time">开拍 {{ formatTime(item.startTime) }}</text>
            <text
              v-if="countdownText(item.startTime)"
              class="countdown"
              :class="{ started: countdownText(item.startTime) === '已开拍' }"
            >{{ countdownText(item.startTime) }}</text>
          </view>
        </view>
      </view>
    </view>
    <view v-if="loadingMore" class="load-tip">加载中...</view>
    <view v-else-if="!hasMore && houseList.length" class="load-tip">没有更多了</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onReachBottom, onShow, onHide, onUnload } from '@dcloudio/uni-app'
import { getToken } from '@/utils/auth'
import { getAgencyCustomerMatchHouses, getAgencyManualRequirementMatchHouses } from '@/api/agency'
import { resolveFileUrl } from '@/utils/fileUrl'
import { useAuctionCountdown } from '@/composables/useAuctionCountdown'

const {
  applyServerTime,
  startTicker,
  stopCountdown,
  countdownText
} = useAuctionCountdown()

const userId = ref(null)
const requirementId = ref(null)
const nickName = ref('')
const matchSource = ref('profile')
const houseList = ref([])
const pageNum = ref(1)
const pageSize = 10
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)

const hasMore = computed(() => houseList.value.length < total.value)

onLoad((options) => {
  if (!getToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login' }), 500)
    return
  }
  userId.value = options.userId || null
  requirementId.value = options.requirementId || null
  nickName.value = decodeURIComponent(options.nickName || '')
  matchSource.value = options.source === 'requirement' ? 'requirement' : 'profile'
  const suffix = matchSource.value === 'requirement' ? '需求匹配房源' : '画像匹配房源'
  const title = nickName.value ? `${nickName.value}的${suffix}` : suffix
  uni.setNavigationBarTitle({ title })
  loadList(true)
})

onReachBottom(() => {
  if (hasMore.value && !loadingMore.value) {
    pageNum.value += 1
    loadList(false)
  }
})

onShow(() => {
  startTicker()
})

onHide(() => {
  stopCountdown()
})

onUnload(() => {
  stopCountdown()
})

function formatTime(time) {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 16)
}

async function loadList(reset = true) {
  if (!userId.value && !requirementId.value) return
  if (reset) {
    loading.value = true
    pageNum.value = 1
  } else {
    loadingMore.value = true
  }
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize,
      source: matchSource.value
    }
    const res = requirementId.value
      ? await getAgencyManualRequirementMatchHouses(requirementId.value, params)
      : await getAgencyCustomerMatchHouses(userId.value, params)
    const rows = res.rows || []
    total.value = res.total || 0
    applyServerTime(res.serverTime)
    houseList.value = reset ? rows : houseList.value.concat(rows)
  } catch (err) {
    if (reset) {
      uni.showToast({ title: err.msg || '加载失败', icon: 'none' })
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function openDetail(item) {
  if (!item.dataId) {
    uni.showToast({ title: '暂无详情', icon: 'none' })
    return
  }
  const title = encodeURIComponent(item.title || '')
  uni.navigateTo({
    url: `/pages/house/detail/index?dataId=${encodeURIComponent(item.dataId)}&title=${title}`
  })
}
</script>

<style lang="scss" scoped>
.houses-page {
  min-height: 100vh;
  background: #f4f4f4;
  padding-bottom: 40rpx;
}

.house-list {
  padding: 20rpx 24rpx;
}

.house-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.house-cover {
  width: 220rpx;
  height: 160rpx;
  flex-shrink: 0;
  background: #eee;
}

.house-info {
  flex: 1;
  min-width: 0;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.house-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.house-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.province {
  font-size: 24rpx;
  color: #999;
}

.price {
  font-size: 26rpx;
  color: #2979ff;
  font-weight: 600;
}

.time-row {
  margin-top: 8rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.time {
  margin-top: 0;
  font-size: 22rpx;
  color: #999;
}

.countdown {
  font-size: 22rpx;
  color: #ff6a00;
  font-weight: 500;
}

.countdown.started {
  color: #999;
  font-weight: 400;
}

.empty-tip,
.load-tip {
  text-align: center;
  color: #999;
  padding: 60rpx 0;
  font-size: 26rpx;
}
</style>
