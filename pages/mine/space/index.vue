<template>
  <view class="space-page">
    <view class="header-bg"></view>

    <view class="profile-block">
      <view class="avatar-wrap">
        <image v-if="avatar" :src="avatar" class="avatar" mode="aspectFill"></image>
        <view v-else class="avatar avatar-placeholder">
          <uni-icons type="person-filled" size="40" color="#ccc"></uni-icons>
        </view>
        <view v-if="memberActive" class="crown-badge">
          <uni-icons type="vip-filled" size="14" color="#2979ff"></uni-icons>
        </view>
      </view>

      <view class="stat-row">
        <view class="stat-item" @click="handleToFavorite">
          <text class="stat-num">{{ stats.favoriteCount || 0 }}</text>
          <text class="stat-label">关注</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ stats.likeCount || 0 }}</text>
          <text class="stat-label">获赞</text>
        </view>
      </view>

      <view class="edit-btn" @click="handleToEdit">编辑资料</view>
    </view>

    <view class="info-block">
      <view class="name-row">
        <text class="nickname" :class="{ 'nickname-vip': memberActive }">{{ displayName }}</text>
        <view v-if="memberActive" class="vip-badge">{{ memberLabel }}</view>
      </view>
      <view class="meta-row">
        <text class="meta-text">IP属地：{{ provinceLabel }}</text>
        <text class="detail-link" @click="handleToDetail">详情</text>
      </view>
    </view>

    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

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
            :src="resolveFileUrl(item.imgPath) || '/static/logo.png'"
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
import { computed, ref, getCurrentInstance } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import { useUserStore } from '@/store'
import { getUserCenterStats } from '@/api/userCenter'
import { getBehaviorPage } from '@/api/userBehavior'
import { listAuction } from '@/api/auction'
import { resolveFileUrl } from '@/utils/fileUrl'
import { refreshMemberStatus, isMember, getMemberDisplayText } from '@/utils/member'
import { getToken } from '@/utils/auth'

const { proxy } = getCurrentInstance()
const userStore = useUserStore()

const tabs = [
  { key: 'dynamic', label: '动态' },
  { key: 'favorite', label: '收藏' },
  { key: 'browse', label: '足迹' }
]

const activeTab = ref('dynamic')
const stats = ref({ favoriteCount: 0, likeCount: 0, provinceName: '', provinceListingCount: 0 })
const gridList = ref([])
const pageNum = ref(1)
const pageSize = 4
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const memberActive = ref(false)
const memberLabel = ref('会员')

const avatar = computed(() => userStore.avatar)
const displayName = computed(() => userStore.name || '用户')
const provinceLabel = computed(() => stats.value.provinceName || '未知')

const hasMore = computed(() => gridList.value.length < total.value)

const sectionTitle = computed(() => {
  if (activeTab.value === 'dynamic') return `最新房源 ${total.value}`
  if (activeTab.value === 'favorite') return `收藏 ${total.value}`
  return `足迹 ${total.value}`
})

const emptyText = computed(() => {
  if (activeTab.value === 'dynamic') return '暂无本省最新房源'
  if (activeTab.value === 'favorite') return '暂无收藏'
  return '暂无浏览足迹'
})

onLoad(() => {
  if (!getToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login' }), 500)
    return
  }
  initPage()
})

onReachBottom(() => {
  if (hasMore.value && !loadingMore.value) {
    loadMore()
  }
})

async function initPage() {
  await userStore.getInfo().catch(() => {})
  await refreshMemberStatus()
  memberActive.value = isMember()
  memberLabel.value = getMemberDisplayText()
  try {
    const res = await getUserCenterStats()
    stats.value = res.data || res || {}
  } catch (err) {
    console.warn('加载统计失败', err)
  }
  reloadList()
}

function switchTab(key) {
  if (activeTab.value === key) return
  activeTab.value = key
  reloadList()
}

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
    if (activeTab.value === 'dynamic') {
      const filter = stats.value.dynamicFilter || {}
      const res = await listAuction({
        pageNum: pageNum.value,
        pageSize,
        provinceName: filter.provinceName || stats.value.provinceName || undefined,
        cityName: filter.cityName || undefined,
        districtName: filter.districtName || undefined,
        recentDays: filter.recentDays || stats.value.recentDays || undefined
      })
      const rows = res.rows || []
      total.value = res.total || 0
      gridList.value = append ? gridList.value.concat(rows) : rows
    } else {
      const res = await getBehaviorPage({
        type: activeTab.value === 'browse' ? 'browse' : 'favorite',
        pageNum: pageNum.value,
        pageSize
      })
      const payload = res.data || res
      const rows = payload.rows || []
      total.value = payload.total || 0
      gridList.value = append ? gridList.value.concat(rows) : rows
    }
  } catch (err) {
    console.error('加载列表失败', err)
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

function handleToFavorite() {
  proxy.$tab.navigateTo('/pages/mine/behavior/index?type=favorite')
}

function handleToEdit() {
  proxy.$tab.navigateTo('/pages/mine/info/edit')
}

function handleToDetail() {
  proxy.$tab.navigateTo('/pages/mine/info/index')
}

function openDetail(item) {
  if (!item?.dataId) return
  const title = encodeURIComponent(item.title || '标的详情')
  proxy.$tab.navigateTo(`/pages/house/detail/index?dataId=${encodeURIComponent(item.dataId)}&title=${title}`)
}
</script>

<style lang="scss" scoped>
page {
  background: #f4f4f4;
}

.space-page {
  min-height: 100vh;
  padding-bottom: 40rpx;
}

.header-bg {
  height: 220rpx;
  background: linear-gradient(180deg, #e8f0ff, #f4f4f4);
}

.profile-block {
  margin: -120rpx 24rpx 0;
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  position: relative;
}

.avatar-wrap {
  position: relative;
  width: 140rpx;
  margin-top: -70rpx;
}

.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  background: #f0f0f0;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.crown-badge {
  position: absolute;
  right: 0;
  top: 0;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #fff;
  border: 2rpx solid #2979ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-row {
  display: flex;
  justify-content: flex-end;
  gap: 48rpx;
  margin-top: -80rpx;
  padding-right: 12rpx;
}

.stat-item {
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
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #999;
}

.edit-btn {
  margin-top: 24rpx;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  border-radius: 12rpx;
  border: 1rpx solid #2979ff;
  color: #2979ff;
  font-size: 28rpx;
}

.info-block {
  margin: 20rpx 24rpx 0;
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.nickname-vip {
  color: #2979ff;
}

.vip-badge {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #eef4ff;
  font-size: 22rpx;
  color: #2979ff;
  line-height: 1.4;
  max-width: 360rpx;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.meta-text {
  font-size: 24rpx;
  color: #999;
}

.detail-link {
  font-size: 24rpx;
  color: #666;
}

.tabs {
  display: flex;
  margin: 20rpx 24rpx 0;
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  overflow: hidden;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #2979ff;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 48rpx;
  height: 4rpx;
  background: #2979ff;
  border-radius: 2rpx;
}

.content-section {
  margin: 0 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 0 0 20rpx 20rpx;
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
