<template>
  <view class="map-page">
    <view class="location-bar">
      <view class="location-info" @click="switchProvince">
        <uni-icons type="location-filled" size="18" color="#2979ff"></uni-icons>
        <text class="location-text">当前：{{ locationLabel }}</text>
        <text class="map-provider-tag">{{ mapProviderLabel }}</text>
      </view>
      <view class="bar-actions">
        <text v-if="provinceName" class="refresh-btn" @click="viewNational">全国</text>
        <text class="refresh-btn" @click="initPage">重新定位</text>
      </view>
    </view>

    <!-- #ifdef APP-PLUS -->
    <map
      class="house-map"
      :provider="nativeMapProvider"
      :latitude="mapCenter.latitude"
      :longitude="mapCenter.longitude"
      :scale="scale"
      :markers="markers"
      :show-location="true"
      enable-scroll
      enable-zoom
    ></map>
    <!-- #endif -->
    <!-- #ifndef APP-PLUS -->
    <map
      class="house-map"
      :latitude="mapCenter.latitude"
      :longitude="mapCenter.longitude"
      :scale="scale"
      :markers="markers"
      :show-location="true"
      enable-scroll
      enable-zoom
    ></map>
    <!-- #endif -->

    <view class="list-panel">
      <view class="panel-title">
        <text>{{ provinceName || '全国' }} 拍卖房源</text>
        <text class="total-text">共 {{ total }} 条</text>
      </view>

      <scroll-view scroll-y class="house-list" @scrolltolower="loadMore">
        <view v-if="loading && houseList.length === 0" class="empty-tip">加载中...</view>
        <view v-else-if="houseList.length === 0" class="empty-tip">暂无房源数据</view>
        <view
          v-for="item in houseList"
          :key="item.id"
          class="house-card"
          @click="openDetail(item)"
        >
          <image
            class="house-cover"
            :src="resolveFileUrl(item.imgPath) || '/static/logo.png'"
            mode="aspectFill"
          ></image>
          <view class="house-info">
            <text class="house-title">{{ item.title }}</text>
            <view class="house-meta">
              <text class="price">起拍 {{ item.startPrice }} 万</text>
              <text class="view">围观 {{ item.viewCount || 0 }}</text>
            </view>
            <text class="time">开拍 {{ formatTime(item.startTime) }}</text>
          </view>
        </view>
        <view v-if="loading && houseList.length > 0" class="load-more">加载中...</view>
        <view v-else-if="finished && houseList.length > 0" class="load-more">没有更多了</view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { listAuction } from '@/api/auction'
import { resolveFileUrl } from '@/utils/fileUrl'
import {
  resolveCurrentProvince,
  chooseProvinceManually,
  getEffectiveLocation,
  setManualProvincePreference,
  clearManualProvincePreference,
  clearLocationCache
} from '@/utils/location'
import { getProvinceCenter } from '@/utils/province'
import { finishProvincePicker } from '@/utils/provincePicker'
import { getMapProviderLabel, getNativeMapProvider } from '@/utils/map/config'

const provinceName = ref('')
const locating = ref(false)
const locationLabel = computed(() => {
  if (locating.value) return '定位中...'
  return provinceName.value || '全国'
})
const mapProviderLabel = ref(getMapProviderLabel())
const nativeMapProvider = ref(getNativeMapProvider())
const mapCenter = ref({ latitude: 39.9042, longitude: 116.4074 })
const scale = ref(8)
const markers = ref([])
const houseList = ref([])
const total = ref(0)
const loading = ref(false)
const finished = ref(false)
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  provinceName: ''
})

function formatTime(time) {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 16)
}

function updateMapView(location, province) {
  const chinaCenter = { latitude: 35.8617, longitude: 104.1954 }
  const center = location || (province ? getProvinceCenter(province) : chinaCenter)
  mapCenter.value = {
    latitude: center.latitude,
    longitude: center.longitude
  }
  scale.value = location ? 11 : (province ? 7 : 4)
  markers.value = location ? [{
    id: 1,
    latitude: location.latitude,
    longitude: location.longitude,
    width: 28,
    height: 28,
    callout: {
      content: '我的位置',
      display: 'ALWAYS',
      padding: 6,
      borderRadius: 6,
      fontSize: 12
    }
  }] : []
}

async function loadHouseList(reset = false) {
  if (loading.value) return
  if (reset) {
    queryParams.value.pageNum = 1
    finished.value = false
    houseList.value = []
  }
  if (finished.value) return

  loading.value = true
  try {
    queryParams.value.provinceName = provinceName.value || undefined
    const res = await listAuction(queryParams.value)
    const rows = res.rows || []
    total.value = res.total || 0
    houseList.value = reset ? rows : houseList.value.concat(rows)
    finished.value = houseList.value.length >= total.value
    if (!finished.value) {
      queryParams.value.pageNum += 1
    }
  } catch (err) {
    console.error('房源加载失败', err)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  loadHouseList(false)
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

async function applyLocation(forceRefresh = false) {
  const effective = getEffectiveLocation({ forceRefresh })
  if (effective) {
    provinceName.value = effective.provinceName
    updateMapView(effective.location, effective.provinceName)
    await loadHouseList(true)
    return
  }
  await initPage(forceRefresh)
}

async function initPage(forceRefresh = true) {
  if (locating.value) return
  locating.value = true
  uni.showLoading({ title: '定位中...' })
  try {
    if (forceRefresh) {
      clearManualProvincePreference()
    }
    const result = await resolveCurrentProvince({ allowManual: false, forceRefresh })
    if (result?.provinceName) {
      provinceName.value = result.provinceName
      updateMapView(result.location, result.provinceName)
    } else {
      uni.showToast({ title: '定位失败，已展示全国房源', icon: 'none' })
      provinceName.value = ''
      updateMapView(null, '')
    }
    await loadHouseList(true)
  } finally {
    locating.value = false
    finishProvincePicker()
    uni.hideLoading()
  }
}

async function switchProvince() {
  try {
    const selected = await chooseProvinceManually(provinceName.value)
    provinceName.value = selected || ''
    setManualProvincePreference(provinceName.value)
    clearLocationCache()
    updateMapView(null, provinceName.value)
    await loadHouseList(true)
  } finally {
    finishProvincePicker()
  }
}

function viewNational() {
  provinceName.value = ''
  setManualProvincePreference('')
  clearLocationCache()
  updateMapView(null, '')
  loadHouseList(true)
}

onLoad((options) => {
  if (options.provinceName) {
    provinceName.value = decodeURIComponent(options.provinceName)
    updateMapView(null, provinceName.value)
    loadHouseList(true)
    return
  }
  applyLocation(false)
})
</script>

<style scoped>
.map-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f6f7;
}

.location-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: #fff;
}

.location-info {
  display: flex;
  align-items: center;
}

.location-text {
  margin-left: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.map-provider-tag {
  margin-left: 12rpx;
  padding: 2rpx 12rpx;
  font-size: 22rpx;
  color: #2979ff;
  background: #eef4ff;
  border-radius: 8rpx;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.refresh-btn {
  font-size: 26rpx;
  color: #2979ff;
}

.house-map {
  width: 100%;
  height: 42vh;
}

.list-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  margin-top: -16rpx;
  overflow: hidden;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.total-text {
  font-size: 24rpx;
  color: #999;
  font-weight: 400;
}

.house-list {
  flex: 1;
  height: 0;
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}

.house-card {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.house-cover {
  width: 180rpx;
  height: 136rpx;
  border-radius: 12rpx;
  background: #f5f5f5;
  flex-shrink: 0;
}

.house-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.house-title {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.house-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price {
  font-size: 28rpx;
  color: #e64340;
  font-weight: 600;
}

.view {
  font-size: 24rpx;
  color: #999;
}

.time {
  font-size: 24rpx;
  color: #666;
}

.empty-tip,
.load-more {
  text-align: center;
  color: #999;
  font-size: 26rpx;
  padding: 40rpx 0;
}
</style>
