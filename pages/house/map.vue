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



    <view class="map-wrap">

      <!-- #ifdef APP-PLUS -->

      <map

        class="house-map"

        :provider="nativeMapProvider"

        :latitude="mapCenter.latitude"

        :longitude="mapCenter.longitude"

        :scale="scale"

        :markers="markers"

        :circles="mapCircles"

        :show-location="true"

        enable-scroll

        enable-zoom

        @markertap="onMarkerTap"

      ></map>

      <!-- #endif -->

      <!-- #ifndef APP-PLUS -->

      <map

        class="house-map"

        :latitude="mapCenter.latitude"

        :longitude="mapCenter.longitude"

        :scale="scale"

        :markers="markers"

        :circles="mapCircles"

        :show-location="true"

        enable-scroll

        enable-zoom

        @markertap="onMarkerTap"

      ></map>

      <!-- #endif -->



      <view v-if="nearbyMode" class="range-badge">

        <text>周边 {{ nearbyRadiusKm }} km</text>

      </view>



      <view class="locate-fab" @click="locateToMe">

        <uni-icons type="navigate-filled" size="22" color="#2979ff"></uni-icons>

      </view>

    </view>



    <view class="list-panel">

      <view class="panel-title">

        <view class="panel-title-main">

          <text>{{ panelTitle }}</text>

          <text v-if="nearbyMode" class="panel-sub">以{{ centerLabel }}为中心</text>

        </view>

        <text class="total-text">共 {{ total }} 条</text>

      </view>



      <scroll-view scroll-y class="house-list" @scrolltolower="loadMore">

        <view v-if="loading && houseList.length === 0" class="empty-tip">加载中...</view>

        <view v-else-if="houseList.length === 0" class="empty-tip">{{ emptyTip }}</view>



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

          ></image>

          <view class="house-info">

            <text class="house-title">{{ item.title }}</text>

            <view class="house-meta">

              <text class="price">起拍 {{ item.startPrice }} 万</text>

              <text v-if="item.distanceKm != null" class="distance">{{ formatDistance(item.distanceKm) }}</text>

              <text v-else class="view">围观 {{ item.viewCount || 0 }}</text>

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

import config from '@/config'

import { listAuction, listAuctionNearby } from '@/api/auction'

import { resolveFileUrl } from '@/utils/fileUrl'

import {

  resolveCurrentProvince,

  chooseProvinceManually,

  getEffectiveLocation,

  getCurrentLocation,

  setManualProvincePreference,

  clearManualProvincePreference,

  clearLocationCache,

  setLocationCache

} from '@/utils/location'

import { reverseGeocodeWithFallback } from '@/utils/map/geocode'

import { getProvinceCenter } from '@/utils/province'

import { finishProvincePicker } from '@/utils/provincePicker'

import { getMapProviderLabel, getNativeMapProvider } from '@/utils/map/config'



const provinceName = ref('')

const locating = ref(false)

const searchCenter = ref(null)

const nearbyRadiusKm = ref(config.map?.nearbyRadiusKm || 50)

const mapCircles = ref([])

const markerItems = ref([])



const locationLabel = computed(() => {

  if (locating.value) return '定位中...'

  return provinceName.value || '全国'

})



const nearbyMode = computed(() => !!provinceName.value && !!searchCenter.value)



const panelTitle = computed(() => {

  if (!provinceName.value) return '全国 拍卖房源'

  if (nearbyMode.value) return `${provinceName.value} · 附近 ${nearbyRadiusKm.value}km`

  return `${provinceName.value} 拍卖房源`

})



const centerLabel = computed(() => {

  const cache = getEffectiveLocation()

  if (cache?.location && searchCenter.value) return '当前位置'

  return provinceName.value || '地图中心'

})



const emptyTip = computed(() => {

  if (nearbyMode.value) return `附近 ${nearbyRadiusKm.value}km 内暂无带坐标的房源`

  return '暂无房源数据'

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



function formatDistance(km) {

  const value = Number(km)

  if (Number.isNaN(value)) return ''

  if (value < 1) return `${Math.round(value * 1000)}m`

  return `${value.toFixed(1)}km`

}



function truncateTitle(title, maxLen = 18) {

  const text = String(title || '标的')

  return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text

}



function scaleFromRadius(radiusKm) {

  if (radiusKm <= 5) return 13

  if (radiusKm <= 20) return 11

  if (radiusKm <= 50) return 10

  if (radiusKm <= 100) return 9

  return 8

}



function updateRangeCircle() {

  if (!nearbyMode.value || !searchCenter.value) {

    mapCircles.value = []

    return

  }

  mapCircles.value = [{

    latitude: searchCenter.value.latitude,

    longitude: searchCenter.value.longitude,

    radius: nearbyRadiusKm.value * 1000,

    color: '#2979ff55',

    fillColor: '#2979ff18',

    strokeWidth: 2

  }]

}



function buildMapMarkers(items) {

  markerItems.value = items || []

  markers.value = (items || [])

    .filter(item => item.latitude != null && item.longitude != null)

    .map((item, index) => ({

      id: index + 100,

      latitude: Number(item.latitude),

      longitude: Number(item.longitude),

      width: 26,

      height: 26,

      dataId: item.dataId,

      callout: {

        content: truncateTitle(item.title),

        display: 'BYCLICK',

        padding: 8,

        borderRadius: 8,

        fontSize: 12

      }

    }))

}



function updateMapView(center, province, options = {}) {

  const { showRange = false } = options

  const chinaCenter = { latitude: 35.8617, longitude: 104.1954 }

  const target = center || (province ? getProvinceCenter(province) : chinaCenter)

  mapCenter.value = {

    latitude: Number(target.latitude),

    longitude: Number(target.longitude)

  }

  if (showRange && center) {

    scale.value = scaleFromRadius(nearbyRadiusKm.value)

    updateRangeCircle()

  } else {

    scale.value = center ? 11 : (province ? 7 : 4)

    mapCircles.value = []

    if (!province && !center) {

      markers.value = []

      markerItems.value = []

    }

  }

}



async function resolveSearchCenter(preferredLocation = null) {

  if (preferredLocation?.latitude != null && preferredLocation?.longitude != null) {

    return preferredLocation

  }

  const effective = getEffectiveLocation()

  if (effective?.location) {

    return effective.location

  }

  if (provinceName.value) {

    return getProvinceCenter(provinceName.value)

  }

  return null

}



async function loadNearbyHouseList(reset = false) {

  if (!provinceName.value || !searchCenter.value) {

    return loadHouseList(reset)

  }

  if (loading.value) return

  if (reset) {

    queryParams.value.pageNum = 1

    finished.value = false

    houseList.value = []

  }

  if (finished.value) return



  loading.value = true

  try {

    const res = await listAuctionNearby({

      provinceName: provinceName.value,

      latitude: searchCenter.value.latitude,

      longitude: searchCenter.value.longitude,

      radiusKm: nearbyRadiusKm.value,

      pageNum: queryParams.value.pageNum,

      pageSize: queryParams.value.pageSize

    })

    const rows = res.rows || []

    const markerData = res.markers || rows

    if (typeof res.radiusKm === 'number' && res.radiusKm > 0) {

      nearbyRadiusKm.value = res.radiusKm

    }

    total.value = res.total || 0

    if (reset) {

      buildMapMarkers(markerData)

      updateMapView(searchCenter.value, provinceName.value, { showRange: true })

    }

    houseList.value = reset ? rows : houseList.value.concat(rows)

    finished.value = houseList.value.length >= total.value

    if (!finished.value) {

      queryParams.value.pageNum += 1

    }

  } catch (err) {

    console.error('附近房源加载失败', err)

  } finally {

    loading.value = false

  }

}



async function loadHouseList(reset = false) {

  if (provinceName.value) {

    searchCenter.value = await resolveSearchCenter()

    if (searchCenter.value) {

      return loadNearbyHouseList(reset)

    }

  } else {

    searchCenter.value = null

    markers.value = []

    markerItems.value = []

    mapCircles.value = []

  }



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

  if (!item?.dataId) {

    uni.showToast({ title: '暂无详情', icon: 'none' })

    return

  }

  const title = encodeURIComponent(item.title || '')

  uni.navigateTo({

    url: `/pages/house/detail/index?dataId=${encodeURIComponent(item.dataId)}&title=${title}`

  })

}



function onMarkerTap(e) {

  const markerId = Number(e?.detail?.markerId)

  const item = markerItems.value[markerId - 100]

  if (item) {

    openDetail(item)

  }

}



async function applyLocation(forceRefresh = false) {

  const effective = getEffectiveLocation({ forceRefresh })

  if (effective?.provinceName) {

    provinceName.value = effective.provinceName

    searchCenter.value = await resolveSearchCenter(effective.location)

    updateMapView(searchCenter.value, provinceName.value, { showRange: !!searchCenter.value })

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

      searchCenter.value = await resolveSearchCenter(result.location)

      updateMapView(searchCenter.value, result.provinceName, { showRange: !!searchCenter.value })

    } else {

      uni.showToast({ title: '定位失败，已展示全国房源', icon: 'none' })

      provinceName.value = ''

      searchCenter.value = null

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

    searchCenter.value = provinceName.value ? getProvinceCenter(provinceName.value) : null

    updateMapView(searchCenter.value, provinceName.value, { showRange: !!searchCenter.value })

    await loadHouseList(true)

  } finally {

    finishProvincePicker()

  }

}



function viewNational() {

  provinceName.value = ''

  setManualProvincePreference('')

  clearLocationCache()

  searchCenter.value = null

  updateMapView(null, '')

  loadHouseList(true)

}



async function locateToMe() {

  if (locating.value) return

  locating.value = true

  uni.showLoading({ title: '定位中...' })

  try {

    const location = await getCurrentLocation()

    let province = provinceName.value

    try {

      const geo = await reverseGeocodeWithFallback(location.latitude, location.longitude)

      if (geo?.province) {

        province = geo.province

        provinceName.value = province

        setLocationCache({

          provinceName: province,

          cityName: geo.city || '',

          districtName: geo.district || '',

          location,

          address: geo.address || ''

        })

      }

    } catch (err) {

      console.warn('逆地理编码失败', err)

    }

    if (!province) {

      uni.showToast({ title: '请先选择省份', icon: 'none' })

      return

    }

    searchCenter.value = location

    updateMapView(searchCenter.value, province, { showRange: true })

    await loadNearbyHouseList(true)

  } catch (err) {

    uni.showToast({ title: '定位失败，请检查权限', icon: 'none' })

  } finally {

    locating.value = false

    uni.hideLoading()

  }

}



onLoad((options) => {

  if (options.provinceName) {

    provinceName.value = decodeURIComponent(options.provinceName)

    searchCenter.value = getProvinceCenter(provinceName.value)

    updateMapView(searchCenter.value, provinceName.value, { showRange: true })

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



.map-wrap {

  position: relative;

  width: 100%;

  height: 42vh;

}



.house-map {

  width: 100%;

  height: 100%;

}



.range-badge {

  position: absolute;

  left: 24rpx;

  top: 24rpx;

  padding: 8rpx 18rpx;

  background: rgba(255, 255, 255, 0.92);

  border-radius: 999rpx;

  font-size: 22rpx;

  color: #2979ff;

  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

  z-index: 9;

}



.locate-fab {

  position: absolute;

  right: 24rpx;

  bottom: 24rpx;

  width: 84rpx;

  height: 84rpx;

  border-radius: 50%;

  background: #fff;

  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.15);

  display: flex;

  align-items: center;

  justify-content: center;

  z-index: 10;

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

  color: #333;

}



.panel-title-main {

  display: flex;

  flex-direction: column;

  gap: 6rpx;

  font-size: 30rpx;

  font-weight: 600;

}



.panel-sub {

  font-size: 22rpx;

  color: #999;

  font-weight: 400;

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

  gap: 12rpx;

}



.price {

  font-size: 28rpx;

  color: #e64340;

  font-weight: 600;

}



.distance,

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

