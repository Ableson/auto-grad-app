<template>
  <view class="requirement-page">
    <view class="filter-bar">
      <view class="filter-item picker-item" :class="{ active: provinceDropdownOpen }">
        <view class="picker-wrap">
          <view v-if="provinceDropdownOpen" class="picker-mask" @click="closeProvinceDropdown"></view>
          <view class="filter-trigger" @click.stop="toggleProvinceDropdown">
            <text :class="['filter-text', { placeholder: !filters.provinceName }]">
              {{ filters.provinceName || '全部省份' }}
            </text>
            <text class="filter-arrow" :class="{ open: provinceDropdownOpen }">▼</text>
          </view>
          <scroll-view v-if="provinceDropdownOpen" scroll-y class="picker-dropdown" @click.stop>
            <view
              class="picker-option"
              :class="{ active: !filters.provinceName }"
              @click="selectProvince(null)"
            >
              <text>全部省份</text>
              <text v-if="!filters.provinceName" class="picker-check">✓</text>
            </view>
            <view
              v-for="item in provinceOptions"
              :key="item.id"
              class="picker-option"
              :class="{ active: item.id === selectedProvinceId }"
              @click="selectProvince(item)"
            >
              <text>{{ areaFullName(item) }}</text>
              <text v-if="item.id === selectedProvinceId" class="picker-check">✓</text>
            </view>
          </scroll-view>
        </view>
      </view>

      <view class="filter-item picker-item" :class="{ active: cityDropdownOpen }">
        <view class="picker-wrap">
          <view v-if="cityDropdownOpen" class="picker-mask" @click="closeCityDropdown"></view>
          <view
            class="filter-trigger"
            :class="{ disabled: !filters.provinceName }"
            @click.stop="toggleCityDropdown"
          >
            <text :class="['filter-text', { placeholder: !filters.cityName }]">
              {{ filters.cityName || (filters.provinceName ? '全部城市' : '请先选省份') }}
            </text>
            <text class="filter-arrow" :class="{ open: cityDropdownOpen }">▼</text>
          </view>
          <scroll-view v-if="cityDropdownOpen" scroll-y class="picker-dropdown" @click.stop>
            <view
              class="picker-option"
              :class="{ active: !filters.cityName }"
              @click="selectCity(null)"
            >
              <text>全部城市</text>
              <text v-if="!filters.cityName" class="picker-check">✓</text>
            </view>
            <view
              v-for="item in cityOptions"
              :key="item.id"
              class="picker-option"
              :class="{ active: isSameArea(item, filters.cityName) }"
              @click="selectCity(item)"
            >
              <text>{{ areaFullName(item) }}</text>
              <text v-if="isSameArea(item, filters.cityName)" class="picker-check">✓</text>
            </view>
          </scroll-view>
        </view>
      </view>

      <picker :range="itemTypeFilterOptions" @change="onItemTypeFilterChange">
        <view class="filter-item filter-picker">
          <text :class="['filter-text', { placeholder: !filters.itemType }]">
            {{ filters.itemType || '全部类型' }}
          </text>
          <text class="filter-arrow">▼</text>
        </view>
      </picker>

      <button class="filter-btn" size="mini" type="primary" @click="reloadList">搜索</button>
    </view>

    <view v-if="loading && !list.length" class="empty-tip">加载中...</view>
    <view v-else-if="!list.length" class="empty-tip">暂无客户需求，可点击右下角按钮添加线下客户</view>
    <view v-else class="list-wrap">
      <view
        v-for="item in list"
        :key="item.id || item.customerUserId"
        class="req-card"
        @click="openDetail(item)"
      >
        <image
          v-if="!isManualItem(item)"
          :src="resolveAvatar(item.avatar)"
          class="avatar"
          mode="aspectFill"
          @click.stop="goProfile(item.customerUserId)"
        />
        <view v-else class="avatar avatar-manual">
          <text class="avatar-text">{{ manualAvatarText(item) }}</text>
        </view>
        <view class="req-main">
          <view class="req-head">
            <text class="name">{{ displayName(item) }}</text>
            <text v-if="isManualItem(item)" class="manual-tag">手动录入</text>
          </view>
          <view class="req-row">
            <text class="label">关注省份</text>
            <view class="tag-wrap">
              <text v-if="!splitTags(item.provinceNames).length" class="tag tag-empty">-</text>
              <text
                v-for="(tag, idx) in splitTags(item.provinceNames)"
                :key="'p-' + item.customerUserId + '-' + idx"
                class="tag"
              >{{ tag }}</text>
            </view>
          </view>
          <view class="req-row">
            <text class="label">关注城市</text>
            <view class="tag-wrap">
              <text v-if="!splitTags(item.cityNames).length" class="tag tag-empty">-</text>
              <text
                v-for="(tag, idx) in splitTags(item.cityNames)"
                :key="'c-' + item.customerUserId + '-' + idx"
                class="tag"
              >{{ tag }}</text>
            </view>
          </view>
          <view class="req-row">
            <text class="label">标的类型</text>
            <view class="tag-wrap">
              <text v-if="!item.itemType" class="tag tag-empty">-</text>
              <text v-else class="tag tag-type">{{ item.itemType }}</text>
            </view>
          </view>
        </view>
        <view class="match-side" @click.stop="openMatchHouses(item)">
          <text class="match-num">{{ item.matchHouseCount || 0 }}</text>
          <text class="match-label">匹配房源</text>
        </view>
      </view>
    </view>

    <view v-if="loadingMore" class="load-tip">加载中...</view>
    <view v-else-if="!hasMore && list.length" class="load-tip">没有更多了</view>

    <view class="fab-add" @click="openCreate">
      <image class="fab-icon" src="/static/images/tabbar/add_.png" mode="aspectFit" />
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import { getToken } from '@/utils/auth'
import { getAgencyApplyStatus, getAgencyRequirementPage } from '@/api/agency'
import { useAreaStore } from '@/store'
import config from '@/config'
import defAva from '@/static/images/profile.jpg'

const baseUrl = config.baseUrl
const areaStore = useAreaStore()
const itemTypeFilterOptions = ['全部类型', '住宅', '商业', '车辆', '土地', '股权', '其他']

const list = ref([])
const pageNum = ref(1)
const pageSize = 10
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const selectedProvinceId = ref('')
const provinceDropdownOpen = ref(false)
const cityDropdownOpen = ref(false)
const filters = ref({
  provinceName: '',
  cityName: '',
  itemType: ''
})

const provinceOptions = computed(() => areaStore.provinces)
const cityOptions = computed(() => {
  if (!selectedProvinceId.value) return []
  return areaStore.getCitiesByProvinceId(selectedProvinceId.value, filters.value.cityName)
})

const hasMore = computed(() => list.value.length < total.value)

onLoad(async () => {
  if (!getToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login' }), 500)
    return
  }
  await areaStore.ensureLoaded()
  const allowed = await ensureAgencyAccess()
  if (allowed) reloadList()
})

onReachBottom(() => {
  if (hasMore.value && !loadingMore.value) {
    pageNum.value += 1
    fetchList(true)
  }
})

function toggleProvinceDropdown() {
  cityDropdownOpen.value = false
  provinceDropdownOpen.value = !provinceDropdownOpen.value
}

function closeProvinceDropdown() {
  provinceDropdownOpen.value = false
}

function toggleCityDropdown() {
  if (!filters.value.provinceName) {
    uni.showToast({ title: '请先选择省份', icon: 'none' })
    return
  }
  provinceDropdownOpen.value = false
  cityDropdownOpen.value = !cityDropdownOpen.value
}

function closeCityDropdown() {
  cityDropdownOpen.value = false
}

function areaFullName(area) {
  return areaStore.getAreaFullName(area)
}

function isSameArea(area, name) {
  if (!area || !name) return false
  return areaStore.getAreaFullName(area) === name || area.name === name
}

function selectProvince(province) {
  if (!province) {
    selectedProvinceId.value = ''
    filters.value.provinceName = ''
    filters.value.cityName = ''
  } else if (selectedProvinceId.value !== province.id) {
    selectedProvinceId.value = province.id
    filters.value.provinceName = areaStore.getAreaFullName(province)
    filters.value.cityName = ''
  }
  closeProvinceDropdown()
}

function selectCity(city) {
  filters.value.cityName = city ? areaStore.getAreaFullName(city) : ''
  closeCityDropdown()
}

function onItemTypeFilterChange(e) {
  const idx = Number(e.detail.value)
  filters.value.itemType = idx === 0 ? '' : itemTypeFilterOptions[idx]
}

async function ensureAgencyAccess() {
  try {
    const res = await getAgencyApplyStatus()
    const data = res.data || res
    if (!data.isAgencyStaff) {
      uni.showModal({
        title: '提示',
        content: '仅限辅拍机构人员访问',
        showCancel: false,
        success: () => uni.navigateBack()
      })
      return false
    }
    return true
  } catch (e) {
    return false
  }
}

function displayName(item) {
  if (isManualItem(item)) {
    return item.customerName || '线下客户'
  }
  if (item.nickName) return item.nickName
  return `用户${item.customerUserId}`
}

function isManualItem(item) {
  return item?.sourceType === '2'
}

function manualAvatarText(item) {
  const name = item?.customerName || '客'
  return name.slice(0, 1)
}

function openCreate() {
  uni.navigateTo({ url: '/pages/work/requirement/detail?mode=create' })
}

function splitTags(value) {
  if (!value) return []
  return String(value)
    .replace(/，/g, ',')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function resolveAvatar(avatar) {
  if (!avatar) return defAva
  if (/^https?:\/\//.test(avatar)) return avatar
  return baseUrl + avatar
}

function goProfile(userId) {
  if (!userId) return
  uni.navigateTo({ url: `/pages/work/customer/profile?userId=${userId}` })
}

function openDetail(item) {
  if (isManualItem(item)) {
    uni.navigateTo({ url: `/pages/work/requirement/detail?id=${item.id}&mode=manual` })
    return
  }
  uni.navigateTo({ url: `/pages/work/requirement/detail?userId=${item.customerUserId}` })
}

function openMatchHouses(item) {
  const name = encodeURIComponent(displayName(item))
  if (isManualItem(item)) {
    uni.navigateTo({
      url: `/pages/work/customer/houses?requirementId=${item.id}&nickName=${name}&source=requirement`
    })
    return
  }
  uni.navigateTo({
    url: `/pages/work/customer/houses?userId=${item.customerUserId}&nickName=${name}&source=requirement`
  })
}

function reloadList() {
  pageNum.value = 1
  list.value = []
  total.value = 0
  fetchList(false)
}

async function fetchList(append = false) {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  try {
    const res = await getAgencyRequirementPage({
      pageNum: pageNum.value,
      pageSize,
      provinceName: filters.value.provinceName || undefined,
      cityName: filters.value.cityName || undefined,
      itemType: filters.value.itemType || undefined
    })
    const data = res.data || res
    const rows = data.rows || []
    total.value = data.total || 0
    list.value = append ? list.value.concat(rows) : rows
  } catch (err) {
    if (!append) {
      uni.showToast({ title: err.msg || '加载失败', icon: 'none' })
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}
</script>

<style lang="scss" scoped>
.requirement-page {
  min-height: 100vh;
  background: #f4f4f4;
  padding-bottom: 160rpx;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  background: #fff;
}

.filter-item {
  flex: 1;
  min-width: 160rpx;
}

.filter-item.picker-item {
  position: relative;
  z-index: 1;
}

.filter-item.picker-item.active {
  z-index: 40;
}

.filter-trigger,
.filter-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 16rpx;
}

.filter-trigger.disabled {
  opacity: 0.6;
}

.filter-text {
  flex: 1;
  font-size: 24rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-text.placeholder {
  color: #999;
}

.filter-arrow {
  margin-left: 8rpx;
  font-size: 18rpx;
  color: #999;
  flex-shrink: 0;
}

.filter-arrow.open {
  transform: rotate(180deg);
}

.filter-btn {
  flex-shrink: 0;
}

.fab-add {
  position: fixed;
  right: 32rpx;
  bottom: calc(32rpx + env(safe-area-inset-bottom));
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.fab-add:active {
  opacity: 0.88;
  transform: scale(0.96);
}

.fab-icon {
  width: 64rpx;
  height: 64rpx;
}

.picker-wrap {
  position: relative;
}

.picker-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 20;
}

.picker-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 8rpx);
  max-height: 360rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
  z-index: 30;
}

.picker-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  font-size: 26rpx;
  color: #333;
  border-bottom: 1rpx solid #f5f5f5;
}

.picker-option.active {
  color: #2979ff;
}

.picker-check {
  color: #2979ff;
  font-size: 22rpx;
}

.list-wrap {
  padding: 20rpx 24rpx;
}

.req-card {
  display: flex;
  align-items: stretch;
  gap: 16rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  flex-shrink: 0;
  background: #f0f0f0;
}

.req-main {
  flex: 1;
  min-width: 0;
}

.req-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.manual-tag {
  font-size: 20rpx;
  color: #ff9800;
  background: #fff7e8;
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
}

.avatar-manual {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef4ff;
}

.avatar-text {
  font-size: 34rpx;
  font-weight: 600;
  color: #2979ff;
}

.name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.req-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-top: 10rpx;
  font-size: 24rpx;
}

.label {
  color: #999;
  flex-shrink: 0;
  width: 112rpx;
  line-height: 44rpx;
}

.tag-wrap {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  min-width: 0;
}

.tag {
  display: inline-block;
  background: #eef4ff;
  color: #2979ff;
  font-size: 22rpx;
  padding: 6rpx 14rpx;
  border-radius: 8rpx;
  line-height: 1.4;
}

.tag-type {
  background: #f0f9f4;
  color: #18a058;
}

.tag-empty {
  background: #f5f5f5;
  color: #bbb;
}

.match-side {
  width: 140rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8faff;
  border-radius: 12rpx;
}

.match-side:active {
  opacity: 0.8;
}

.match-num {
  font-size: 36rpx;
  font-weight: 700;
  color: #2979ff;
}

.match-label {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #666;
}

.empty-tip,
.load-tip {
  text-align: center;
  color: #999;
  font-size: 26rpx;
  padding: 80rpx 0;
}
</style>
