<template>
  <view class="behavior-page">
    <view class="content-section">
      <view class="section-head">
        <text class="section-title">{{ sectionTitle }}</text>
        <text v-if="hasMore" class="more-link" @click="loadMore">查看更多</text>
      </view>

      <view v-if="loading && !gridList.length" class="empty-tip">加载中...</view>
      <view v-else-if="!gridList.length" class="empty-tip">{{ emptyText }}</view>
      <view v-else class="grid-wrap">
        <view
          v-for="item in gridList"
          :key="itemKey(item)"
          class="grid-card"
          @click="openDetail(item)"
        >
          <image
            class="grid-cover"
            :src="item.imgPath || '/static/logo.png'"
            mode="aspectFill"
          ></image>
          <text class="grid-title">{{ item.title || item.dataId }}</text>
        </view>
      </view>

      <view v-if="loadingMore" class="load-more-tip">加载中...</view>
      <view v-else-if="!hasMore && gridList.length" class="load-more-tip">没有更多了</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import { getBehaviorPage } from '@/api/userBehavior'
import { getToken } from '@/utils/auth'

const type = ref('favorite')
const gridList = ref([])
const pageNum = ref(1)
const pageSize = 10
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)

const hasMore = computed(() => gridList.value.length < total.value)

const sectionTitle = computed(() => {
  const label = type.value === 'browse' ? '足迹' : '收藏'
  return total.value ? `${label} ${total.value}` : label
})

const emptyText = computed(() => (
  type.value === 'browse' ? '暂无浏览足迹' : '暂无收藏'
))

onLoad((options) => {
  type.value = options.type === 'browse' ? 'browse' : 'favorite'
  uni.setNavigationBarTitle({
    title: type.value === 'browse' ? '浏览足迹' : '我的收藏'
  })
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

function itemKey(item) {
  return item.id || item.dataId
}

function reloadList() {
  pageNum.value = 1
  gridList.value = []
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
    const res = await getBehaviorPage({
      type: type.value === 'browse' ? 'browse' : 'favorite',
      pageNum: pageNum.value,
      pageSize
    })
    const payload = res.data || res
    const rows = payload.rows || []
    total.value = payload.total || 0
    gridList.value = append ? gridList.value.concat(rows) : rows
  } catch (err) {
    console.error('加载列表失败', err)
    if (!append) {
      gridList.value = []
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

function openDetail(item) {
  if (!item?.dataId) return
  const title = encodeURIComponent(item.title || '标的详情')
  uni.navigateTo({
    url: `/pages/house/detail/index?dataId=${encodeURIComponent(item.dataId)}&title=${title}`
  })
}
</script>

<style scoped>
.behavior-page {
  min-height: 100vh;
  background: #f5f6f7;
  padding-bottom: 40rpx;
}

.content-section {
  margin: 20rpx 24rpx 0;
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.more-link {
  font-size: 24rpx;
  color: #999;
}

.grid-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.grid-card {
  width: calc(50% - 8rpx);
}

.grid-cover {
  width: 100%;
  height: 200rpx;
  border-radius: 12rpx;
  background: #f0f0f0;
}

.grid-title {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.empty-tip,
.load-more-tip {
  text-align: center;
  color: #999;
  font-size: 26rpx;
  padding: 40rpx 0;
}
</style>
