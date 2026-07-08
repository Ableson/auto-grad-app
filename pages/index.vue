<template>

  <view class="page">

    <view class="header">

      <view class="search-row">

        <view class="search-box">

          <uni-icons type="search" size="18" color="#999"></uni-icons>

          <input

            v-model="searchKeyword"

            class="search-input"

            type="text"

            confirm-type="search"

            placeholder="搜索标的名称或省份"

            @confirm="handleSearch"

            @focus="showHistory = true"

          />

          <uni-icons

            v-if="searchKeyword"

            type="clear"

            size="18"

            color="#ccc"

            @click="clearSearch"

          ></uni-icons>

        </view>

        <text class="search-btn" @click="handleSearch">搜索</text>

      </view>

      <view class="filter-bar">

        <view
          v-for="tab in filterTabs"
          :key="tab.key"
          class="filter-tab"
          :class="{ active: activeFilter === tab.key || isFilterTabActive(tab.key) }"
          @click.stop="toggleFilter(tab.key)"
        >
          <text class="filter-tab-text">{{ getFilterTabLabel(tab.key) }}</text>
          <text v-if="tab.key !== 'sort'" class="filter-tab-arrow" :class="{ open: activeFilter === tab.key }">▼</text>
          <uni-icons v-else type="list" size="14" :color="activeFilter === tab.key || isFilterTabActive(tab.key) ? '#2979ff' : '#666'"></uni-icons>
        </view>

      </view>

      <view v-if="activeFilter" class="filter-panel-mask" @click="closeFilterPanel"></view>

      <view v-if="activeFilter" class="filter-panel" @click.stop>

        <view v-if="activeFilter === 'region'" class="filter-panel-body region-panel">
          <view class="region-breadcrumb">
            <text
              class="region-crumb"
              :class="{ active: regionNavLevel === 'province' }"
              @click="setRegionNavLevel('province')"
            >{{ filterDraft.provinceName || '不限' }}</text>
            <text v-if="filterDraft.provinceName" class="region-crumb-sep">/</text>
            <text
              v-if="filterDraft.provinceName"
              class="region-crumb"
              :class="{ active: regionNavLevel === 'city' }"
              @click="setRegionNavLevel('city')"
            >{{ filterDraft.cityName || '不限' }}</text>
            <text v-if="filterDraft.cityName" class="region-crumb-sep">/</text>
            <text
              v-if="filterDraft.cityName"
              class="region-crumb"
              :class="{ active: regionNavLevel === 'district' }"
              @click="setRegionNavLevel('district')"
            >{{ filterDraft.districtName || '区县' }}</text>
          </view>
          <view class="region-columns">
            <scroll-view scroll-y class="region-column region-column-left">
              <view
                class="region-item"
                :class="{ active: isRegionLeftActive('') }"
                @click="selectRegionLeft('')"
              >
                <text>不限</text>
              </view>
              <view
                v-for="item in regionLeftList"
                :key="item.id"
                class="region-item"
                :class="{ active: isRegionLeftActive(item) }"
                @click="selectRegionLeft(item)"
              >
                <text>{{ areaFullName(item) }}</text>
              </view>
            </scroll-view>
            <scroll-view v-if="regionRightList.length" scroll-y class="region-column region-column-right">
              <view
                class="region-item"
                :class="{ active: !filterDraft.districtName }"
                @click="selectRegionDistrict('')"
              >
                <text>不限</text>
              </view>
              <view
                v-for="item in regionRightList"
                :key="item.id"
                class="region-item"
                :class="{ active: isSameArea(item, filterDraft.districtName) }"
                @click="selectRegionDistrict(item)"
              >
                <text>{{ areaFullName(item) }}</text>
              </view>
            </scroll-view>
          </view>
        </view>

        <view v-else-if="activeFilter === 'price'" class="filter-panel-body">
          <text class="filter-section-title">价格区间(万)</text>
          <view class="range-input-row">
            <input v-model="filterDraft.minStartPrice" class="range-input" type="digit" placeholder="最低价格" />
            <text class="range-input-sep">至</text>
            <input v-model="filterDraft.maxStartPrice" class="range-input" type="digit" placeholder="最高价格" />
          </view>
          <view class="option-grid">
            <view
              v-for="item in pricePresets"
              :key="item.label"
              class="option-chip"
              :class="{ active: isPricePresetActive(item) }"
              @click="applyPricePreset(item)"
            >{{ item.label }}</view>
          </view>
        </view>

        <view v-else-if="activeFilter === 'area'" class="filter-panel-body">
          <text class="filter-section-title">面积区间(m²)</text>
          <view class="range-input-row">
            <input v-model="filterDraft.minBuildingArea" class="range-input" type="digit" placeholder="最小面积" />
            <text class="range-input-sep">至</text>
            <input v-model="filterDraft.maxBuildingArea" class="range-input" type="digit" placeholder="最大面积" />
          </view>
          <view class="option-grid">
            <view
              v-for="item in areaPresets"
              :key="item.label"
              class="option-chip"
              :class="{ active: isAreaPresetActive(item) }"
              @click="applyAreaPreset(item)"
            >{{ item.label }}</view>
          </view>
        </view>

        <view v-else-if="activeFilter === 'more'" class="filter-panel-body more-panel">
          <text class="filter-section-title">用途</text>
          <view class="option-grid">
            <view
              v-for="item in itemTypeOptions"
              :key="item"
              class="option-chip"
              :class="{ active: filterDraft.itemType === item }"
              @click="filterDraft.itemType = filterDraft.itemType === item ? '' : item"
            >{{ item }}</view>
          </view>
          <text class="filter-section-title">户型</text>
          <view class="option-grid">
            <view
              v-for="item in roomTypeOptions"
              :key="item"
              class="option-chip"
              :class="{ active: filterDraft.houseLayoutRoom === item }"
              @click="filterDraft.houseLayoutRoom = filterDraft.houseLayoutRoom === item ? '' : item"
            >{{ item }}</view>
          </view>
          <text class="filter-section-title">阶段</text>
          <view class="option-grid">
            <view
              v-for="item in stageOptions"
              :key="item.value"
              class="option-chip"
              :class="{ active: filterDraft.auctionStatus === item.value }"
              @click="filterDraft.auctionStatus = filterDraft.auctionStatus === item.value ? '' : item.value"
            >{{ item.label }}</view>
          </view>
        </view>

        <view v-else-if="activeFilter === 'sort'" class="filter-panel-body sort-panel">
          <view
            v-for="item in sortOptions"
            :key="item.value"
            class="sort-item"
            :class="{ active: filterDraft.orderBy === item.value }"
            @click="filterDraft.orderBy = item.value"
          >
            <text>{{ item.label }}</text>
            <text v-if="filterDraft.orderBy === item.value" class="sort-check">✓</text>
          </view>
        </view>

        <view class="filter-panel-footer">
          <view class="filter-reset" @click="resetActiveFilter">
            <uni-icons type="refreshempty" size="16" color="#999"></uni-icons>
            <text>重置</text>
          </view>
          <view class="filter-confirm" @click="confirmFilter">确定</view>
        </view>

      </view>

      <view v-if="showHistory && searchHistory.length" class="history-row">

        <text class="history-label">最近搜索</text>

        <scroll-view scroll-x class="history-scroll">

          <text

            v-for="item in searchHistory"

            :key="item"

            class="history-tag"

            @click="applyHistory(item)"

          >{{ item }}</text>

        </scroll-view>

      </view>

    </view>



    <uni-section :title="listTitle" type="line"></uni-section>



    <scroll-view
      scroll-y
      class="house-scroll"
      refresher-enabled
      :refresher-triggered="refreshing"
      refresher-background="#f5f6f7"
      :lower-threshold="120"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
      @click="closeFilterPanel(); showHistory = false"
    >

      <view class="house-list">

      <view v-if="loading && houseList.length === 0" class="empty-tip">加载中...</view>

      <view v-else-if="houseList.length === 0" class="empty-tip">暂无房源数据</view>



      <view

        v-for="item in houseList"

        :key="item.id"

        class="house-card"

        @click="openDetail(item)"

      >

        <view class="house-media">

          <image

            class="house-cover"

            :src="resolveFileUrl(item.imgPath) || '/static/logo.png'"

            mode="aspectFill"

          ></image>

          <text v-if="formatHouseSpec(item)" class="house-spec">{{ formatHouseSpec(item) }}</text>

        </view>

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

      <view v-if="loadingMore" class="empty-tip">加载更多...</view>
      <view v-else-if="!hasMore && houseList.length" class="empty-tip">没有更多了</view>

      </view>

    </scroll-view>

  </view>

</template>



<script>

import { listAuction } from '@/api/auction'

import { resolveFileUrl } from '@/utils/fileUrl'

import { getSearchHistory } from '@/api/search'

import { getToken } from '@/utils/auth'

import { refreshImTabBadge } from '@/utils/imTabBadge'
import {
  calcServerOffset,
  formatCountdownToStart,
  startCountdownTicker
} from '@/utils/auctionCountdown'
import {
  AREA_PRESETS,
  FILTER_TABS,
  ITEM_TYPE_OPTIONS,
  PRICE_PRESETS,
  ROOM_TYPE_OPTIONS,
  SORT_OPTIONS,
  STAGE_OPTIONS,
  buildAuctionListParams,
  cloneFilters,
  createDefaultFilters,
  getFilterTabLabel,
  isFilterTabActive
} from '@/utils/auctionFilters'
import { useAreaStore } from '@/store/modules/area'

import {

  getLocalSearchHistory,

  saveLocalSearchHistory

} from '@/utils/searchHistory'

import {

  resolveCurrentProvince,

  getEffectiveLocation,

  setManualProvincePreference,

  clearManualProvincePreference

} from '@/utils/location'

import { isPickingProvince, finishProvincePicker } from '@/utils/provincePicker'

import { syncLocationToServer } from '@/utils/userLocation'



export default {

  data() {

    return {

      searchKeyword: '',

      activeSearchValue: '',

      filters: createDefaultFilters(),

      filterDraft: createDefaultFilters(),

      activeFilter: '',

      regionNavLevel: 'province',

      filterTabs: FILTER_TABS,

      pricePresets: PRICE_PRESETS,

      areaPresets: AREA_PRESETS,

      itemTypeOptions: ITEM_TYPE_OPTIONS,

      roomTypeOptions: ROOM_TYPE_OPTIONS,

      stageOptions: STAGE_OPTIONS,

      sortOptions: SORT_OPTIONS,

      searchHistory: [],

      showHistory: false,

      houseList: [],

      total: 0,

      loading: false,

      loadingMore: false,

      listFetching: false,

      refreshing: false,

      locating: false,

      queryParams: {

        pageNum: 1,

        pageSize: 10,

        provinceName: '',

        searchValue: ''

      },

      serverOffset: 0,

      countdownTick: 0,

      countdownTimer: null

    }

  },

  computed: {

    areaStore() {
      return useAreaStore()
    },

    regionProvinceId() {
      const province = this.areaStore.findProvinceByName(this.filterDraft.provinceName)
      return province?.id || ''
    },

    regionCityId() {
      if (!this.regionProvinceId) return ''
      const city = this.areaStore.findCityByName(this.regionProvinceId, this.filterDraft.cityName)
      return city?.id || ''
    },

    regionLeftList() {
      if (this.regionNavLevel === 'district' && this.regionCityId) {
        return this.areaStore.getDistrictsByCityId(this.regionCityId, this.filterDraft.districtName)
      }
      if (this.regionNavLevel === 'city' && this.regionProvinceId) {
        return this.areaStore.getCitiesByProvinceId(this.regionProvinceId, this.filterDraft.cityName)
      }
      return this.areaStore.provinces
    },

    regionRightList() {
      if (this.regionNavLevel === 'city' && this.regionCityId) {
        return this.areaStore.getDistrictsByCityId(this.regionCityId, this.filterDraft.districtName)
      }
      return []
    },

    listTitle() {

      const name = this.filters.provinceName || '全国'

      if (this.activeSearchValue) {

        return `「${this.activeSearchValue}」搜索结果（共 ${this.total} 条）`

      }

      return `${name} 拍卖房源（共 ${this.total} 条）`

    },

    hasMore() {
      return this.houseList.length < this.total
    }

  },

  onLoad() {

    this.loadSearchHistory()

    this.applyLocation(false)

  },

  onShow() {

    if (isPickingProvince()) return

    refreshImTabBadge()

    this.startCountdownTimer()

  },

  onHide() {

    this.stopCountdownTimer()

  },

  onUnload() {

    this.stopCountdownTimer()

  },

  methods: {

    resolveFileUrl,

    formatTime(time) {

      if (!time) return '-'

      return String(time).replace('T', ' ').slice(0, 16)

    },

    formatHouseSpec(item) {

      const parts = []

      if (item.houseLayout) parts.push(item.houseLayout)

      if (item.buildingArea != null && item.buildingArea !== '') {

        parts.push(`${item.buildingArea}㎡`)

      }

      return parts.join(' · ')

    },

    countdownText(startTime) {

      void this.countdownTick

      return formatCountdownToStart(startTime, this.serverOffset)

    },

    startCountdownTimer() {

      this.stopCountdownTimer()

      this.countdownTimer = setInterval(() => {

        this.countdownTick += 1

      }, 1000)

    },

    stopCountdownTimer() {

      if (this.countdownTimer) {

        clearInterval(this.countdownTimer)

        this.countdownTimer = null

      }

    },

    applyServerTime(serverTime) {

      if (serverTime) {

        this.serverOffset = calcServerOffset(serverTime)

      }

    },

    loadSearchHistory() {
      const local = getLocalSearchHistory()
      if (!getToken()) {
        this.searchHistory = local
        return
      }
      getSearchHistory().then(res => {
        const remote = (res.data || []).map(item => item.keyword).filter(Boolean)
        const merged = [...remote]
        local.forEach(item => {
          if (!merged.includes(item)) merged.push(item)
        })
        this.searchHistory = merged
      }).catch(() => {
        this.searchHistory = local
      })
    },

    getFilterTabLabel(tabKey) {
      return getFilterTabLabel(tabKey, this.filters)
    },

    isFilterTabActive(tabKey) {
      return isFilterTabActive(tabKey, this.filters)
    },

    areaFullName(area) {
      return this.areaStore.getAreaFullName(area)
    },

    isSameArea(area, name) {
      if (!area || !name) return false
      return this.areaStore.getAreaFullName(area) === name || area.name === name
    },

    async toggleFilter(key) {
      if (this.activeFilter === key) {
        this.closeFilterPanel()
        return
      }
      this.filterDraft = cloneFilters(this.filters)
      this.activeFilter = key
      this.showHistory = false
      if (key === 'region') {
        await this.areaStore.ensureLoaded()
        this.syncRegionNavLevel()
      }
    },

    closeFilterPanel() {
      this.activeFilter = ''
    },

    syncRegionNavLevel() {
      if (this.filterDraft.cityName) {
        this.regionNavLevel = 'district'
      } else if (this.filterDraft.provinceName) {
        this.regionNavLevel = 'city'
      } else {
        this.regionNavLevel = 'province'
      }
    },

    setRegionNavLevel(level) {
      this.regionNavLevel = level
      if (level === 'province') {
        this.filterDraft.cityName = ''
        this.filterDraft.districtName = ''
      } else if (level === 'city') {
        this.filterDraft.districtName = ''
      }
    },

    isRegionLeftActive(item) {
      if (!item) {
        if (this.regionNavLevel === 'province') return !this.filterDraft.provinceName
        if (this.regionNavLevel === 'city') return !this.filterDraft.cityName
        return !this.filterDraft.districtName
      }
      if (this.regionNavLevel === 'province') {
        return this.isSameArea(item, this.filterDraft.provinceName)
      }
      if (this.regionNavLevel === 'city') {
        return this.isSameArea(item, this.filterDraft.cityName)
      }
      return this.isSameArea(item, this.filterDraft.districtName)
    },

    selectRegionLeft(item) {
      if (!item) {
        if (this.regionNavLevel === 'province') {
          this.filterDraft.provinceName = ''
          this.filterDraft.cityName = ''
          this.filterDraft.districtName = ''
        } else if (this.regionNavLevel === 'city') {
          this.filterDraft.cityName = ''
          this.filterDraft.districtName = ''
        } else {
          this.filterDraft.districtName = ''
        }
        return
      }
      const name = this.areaFullName(item)
      if (this.regionNavLevel === 'province') {
        this.filterDraft.provinceName = name
        this.filterDraft.cityName = ''
        this.filterDraft.districtName = ''
        this.regionNavLevel = 'city'
        return
      }
      if (this.regionNavLevel === 'city') {
        this.filterDraft.cityName = name
        this.filterDraft.districtName = ''
        this.regionNavLevel = 'district'
        return
      }
      this.filterDraft.districtName = name
    },

    selectRegionDistrict(item) {
      this.filterDraft.districtName = item ? this.areaFullName(item) : ''
    },

    isPricePresetActive(item) {
      return String(this.filterDraft.minStartPrice || '') === String(item.min || '')
        && String(this.filterDraft.maxStartPrice || '') === String(item.max || '')
    },

    applyPricePreset(item) {
      this.filterDraft.minStartPrice = item.min === '' ? '' : String(item.min)
      this.filterDraft.maxStartPrice = item.max === '' ? '' : String(item.max)
    },

    isAreaPresetActive(item) {
      return String(this.filterDraft.minBuildingArea || '') === String(item.min || '')
        && String(this.filterDraft.maxBuildingArea || '') === String(item.max || '')
    },

    applyAreaPreset(item) {
      this.filterDraft.minBuildingArea = item.min === '' ? '' : String(item.min)
      this.filterDraft.maxBuildingArea = item.max === '' ? '' : String(item.max)
    },

    resetActiveFilter() {
      const draft = cloneFilters(this.filterDraft)
      if (this.activeFilter === 'region') {
        Object.assign(draft, {
          provinceName: '',
          cityName: '',
          districtName: ''
        })
        this.regionNavLevel = 'province'
      } else if (this.activeFilter === 'price') {
        draft.minStartPrice = ''
        draft.maxStartPrice = ''
      } else if (this.activeFilter === 'area') {
        draft.minBuildingArea = ''
        draft.maxBuildingArea = ''
      } else if (this.activeFilter === 'more') {
        draft.itemType = ''
        draft.houseLayoutRoom = ''
        draft.auctionStatus = ''
      } else if (this.activeFilter === 'sort') {
        draft.orderBy = 'default'
      }
      this.filterDraft = draft
    },

    async confirmFilter() {
      this.filters = cloneFilters(this.filterDraft)
      this.closeFilterPanel()
      if (this.filters.provinceName) {
        setManualProvincePreference(this.filters.provinceName)
      } else {
        setManualProvincePreference('')
      }
      await this.loadList()
    },

    async applyLocation(forceRefresh = false) {

      const effective = getEffectiveLocation({ forceRefresh })

      if (effective) {

        this.filters = {
          ...cloneFilters(this.filters),
          provinceName: effective.provinceName || '',
          cityName: effective.cityName || '',
          districtName: effective.districtName || ''
        }

        await this.loadList()

        if (getToken()) {
          syncLocationToServer({ location: effective }).catch(() => {})
        }

        return

      }

      await this.refreshLocation(forceRefresh)

    },

    async refreshLocation(forceRefresh = true) {

      if (this.locating) return

      this.locating = true

      uni.showLoading({ title: '定位中...' })

      try {

        if (forceRefresh) {

          clearManualProvincePreference()

        }

        const result = await resolveCurrentProvince({ allowManual: false, forceRefresh })

        if (result?.provinceName) {

          this.filters = {
            ...cloneFilters(this.filters),
            provinceName: result.provinceName || '',
            cityName: result.cityName || '',
            districtName: result.districtName || ''
          }

        } else {

          uni.showToast({ title: '定位失败，已展示全国房源', icon: 'none' })

          this.filters = {
            ...cloneFilters(this.filters),
            provinceName: '',
            cityName: '',
            districtName: ''
          }

        }

        await this.loadList()

        if (getToken() && result?.provinceName) {
          syncLocationToServer({ location: result }).catch(() => {})
        }

      } finally {

        this.locating = false

        finishProvincePicker()

        uni.hideLoading()

      }

    },

    applyHistory(keyword) {

      this.searchKeyword = keyword

      this.showHistory = false

      this.handleSearch()

    },

    clearSearch() {

      this.searchKeyword = ''

      this.activeSearchValue = ''

      this.showHistory = false

      this.loadList()

    },

    async handleSearch() {
      const keyword = (this.searchKeyword || '').trim()
      this.showHistory = false
      this.activeSearchValue = keyword
      if (keyword) {
        saveLocalSearchHistory(keyword)
        this.searchHistory = getLocalSearchHistory()
      }
      await this.loadList()
      if (keyword && getToken()) {
        setTimeout(() => this.loadSearchHistory(), 500)
      }
    },

    async loadList(reset = true) {
      if (this.listFetching) return
      if (!reset && !this.hasMore) return

      const nextPage = reset ? 1 : this.queryParams.pageNum + 1
      this.listFetching = true
      if (reset && !this.refreshing) this.loading = true
      if (!reset) this.loadingMore = true

      try {
        const res = await listAuction(buildAuctionListParams(this.filters, {
          ...this.queryParams,
          pageNum: nextPage,
          searchValue: this.activeSearchValue || undefined
        }))

        const rows = res.rows || []
        this.total = res.total || 0
        this.applyServerTime(res.serverTime)
        this.queryParams.pageNum = nextPage

        if (reset) {
          this.houseList = rows
        } else {
          this.houseList = this.houseList.concat(rows)
        }
      } catch (err) {
        console.error('房源列表加载失败', err)
      } finally {
        this.listFetching = false
        this.loading = false
        this.loadingMore = false
      }
    },

    loadMore() {
      if (this.refreshing) return
      this.loadList(false)
    },

    async onRefresh() {
      if (this.refreshing || this.listFetching) return
      this.refreshing = true
      this.closeFilterPanel()
      this.showHistory = false
      try {
        await this.loadList(true)
      } finally {
        this.refreshing = false
      }
    },

    openDetail(item) {

      if (!item.dataId) {

        uni.showToast({ title: '暂无详情', icon: 'none' })

        return

      }

      const title = encodeURIComponent(item.title || '')

      uni.navigateTo({

        url: `/pages/house/detail/index?dataId=${encodeURIComponent(item.dataId)}&title=${title}`

      })

    }

  }

}

</script>



<style scoped>

.page {

  height: 100vh;

  display: flex;

  flex-direction: column;

  background: #f5f6f7;

  overflow: hidden;

}



.header {

  background: #fff;

  padding: 20rpx 0 0;

  flex-shrink: 0;

  position: relative;

  z-index: 30;

}



.search-row {

  display: flex;

  align-items: center;

  gap: 12rpx;

  padding: 0 24rpx 16rpx;

}



.filter-bar {

  display: flex;

  align-items: center;

  border-top: 1rpx solid #f0f0f0;

}



.filter-tab {

  flex: 1;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 4rpx;

  height: 72rpx;

  min-width: 0;

}



.filter-tab.active .filter-tab-text,
.filter-tab.active .filter-tab-arrow {

  color: #2979ff;

}



.filter-tab-text {

  font-size: 26rpx;

  color: #333;

  max-width: 120rpx;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

}



.filter-tab-arrow {

  font-size: 16rpx;

  color: #666;

  transition: transform 0.2s ease;

}



.filter-tab-arrow.open {

  transform: rotate(180deg);

}



.filter-panel-mask {

  position: fixed;

  left: 0;

  right: 0;

  top: 0;

  bottom: 0;

  background: rgba(0, 0, 0, 0.35);

  z-index: 19;

}



.filter-panel {

  position: absolute;

  left: 0;

  right: 0;

  top: 100%;

  background: #fff;

  z-index: 25;

  box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.08);

}



.filter-panel-body {

  padding: 24rpx;

  max-height: 60vh;

  overflow-y: auto;

}



.filter-section-title {

  display: block;

  font-size: 28rpx;

  color: #333;

  font-weight: 600;

  margin-bottom: 20rpx;

}



.filter-section-title + .option-grid {

  margin-bottom: 24rpx;

}



.range-input-row {

  display: flex;

  align-items: center;

  gap: 16rpx;

  margin-bottom: 24rpx;

}



.range-input {

  flex: 1;

  height: 72rpx;

  border-bottom: 1rpx solid #e5e5e5;

  font-size: 28rpx;

  color: #333;

}



.range-input-sep {

  font-size: 26rpx;

  color: #999;

}



.option-grid {

  display: flex;

  flex-wrap: wrap;

  gap: 16rpx;

}



.option-chip {

  width: calc((100% - 32rpx) / 3);

  height: 68rpx;

  display: flex;

  align-items: center;

  justify-content: center;

  background: #f5f6f7;

  border-radius: 8rpx;

  font-size: 24rpx;

  color: #666;

}



.option-chip.active {

  background: #eef4ff;

  color: #2979ff;

}



.region-panel {

  padding: 0;

  max-height: 52vh;

}



.region-breadcrumb {

  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 8rpx;

  padding: 20rpx 24rpx;

  border-bottom: 1rpx solid #f0f0f0;

}



.region-crumb {

  font-size: 26rpx;

  color: #666;

}



.region-crumb.active {

  color: #2979ff;

  font-weight: 600;

}



.region-crumb-sep {

  font-size: 24rpx;

  color: #ccc;

}



.region-columns {

  display: flex;

  min-height: 360rpx;

  max-height: 360rpx;

}



.region-column {

  height: 360rpx;

}



.region-column-left {

  width: 42%;

  background: #f7f8fa;

}



.region-column-right {

  flex: 1;

  background: #fff;

}



.region-item {

  padding: 24rpx 20rpx;

  font-size: 26rpx;

  color: #333;

  position: relative;

}



.region-item.active {

  color: #2979ff;

  background: #fff;

  font-weight: 600;

}



.region-column-left .region-item.active::before {

  content: '';

  position: absolute;

  left: 0;

  top: 20rpx;

  bottom: 20rpx;

  width: 6rpx;

  background: #2979ff;

  border-radius: 3rpx;

}



.sort-panel {

  padding: 0;

}



.sort-item {

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 28rpx 24rpx;

  font-size: 28rpx;

  color: #333;

  border-bottom: 1rpx solid #f5f5f5;

}



.sort-item.active {

  color: #2979ff;

}



.sort-check {

  color: #2979ff;

  font-size: 28rpx;

}



.filter-panel-footer {

  display: flex;

  align-items: center;

  gap: 20rpx;

  padding: 20rpx 24rpx 24rpx;

  border-top: 1rpx solid #f0f0f0;

}



.filter-reset {

  display: flex;

  align-items: center;

  gap: 8rpx;

  font-size: 26rpx;

  color: #999;

  padding: 0 12rpx;

}



.filter-confirm {

  flex: 1;

  height: 80rpx;

  line-height: 80rpx;

  text-align: center;

  background: #2979ff;

  color: #fff;

  border-radius: 12rpx;

  font-size: 30rpx;

}



.search-box {

  flex: 1;

  min-width: 0;

  display: flex;

  align-items: center;

  background: #f5f6f7;

  border-radius: 32rpx;

  padding: 0 20rpx;

  height: 72rpx;

}



.search-input {

  flex: 1;

  min-width: 0;

  margin-left: 12rpx;

  font-size: 28rpx;

  color: #333;

}



.search-btn {

  font-size: 28rpx;

  color: #2979ff;

  flex-shrink: 0;

  padding: 0 4rpx;

  white-space: nowrap;

}



.history-row {

  display: flex;

  align-items: center;

  margin-top: 16rpx;

}



.history-label {

  font-size: 24rpx;

  color: #999;

  flex-shrink: 0;

  margin-right: 12rpx;

}



.history-scroll {

  flex: 1;

  white-space: nowrap;

}



.history-tag {

  display: inline-block;

  padding: 8rpx 20rpx;

  margin-right: 12rpx;

  background: #f0f0f0;

  border-radius: 24rpx;

  font-size: 24rpx;

  color: #666;

}



.house-scroll {

  flex: 1;

  height: 0;

  background: #f5f6f7;

}



.house-list {

  padding: 0 24rpx 30rpx;

}



.house-card {

  display: flex;

  background: #fff;

  border-radius: 16rpx;

  padding: 20rpx;

  margin-bottom: 20rpx;

}



.house-media {

  width: 200rpx;

  flex-shrink: 0;

}

.house-cover {

  width: 100%;

  height: 150rpx;

  border-radius: 12rpx;

  background: #f5f5f5;

}

.house-spec {

  margin-top: 8rpx;

  font-size: 22rpx;

  color: #666;

  line-height: 1.4;

  display: -webkit-box;

  -webkit-box-orient: vertical;

  -webkit-line-clamp: 2;

  overflow: hidden;

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



.province {

  font-size: 24rpx;

  color: #666;

}



.price {

  font-size: 28rpx;

  color: #e64340;

  font-weight: 600;

}



.time-row {
  margin-top: 8rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.time {

  font-size: 24rpx;

  color: #999;

}

.countdown {
  font-size: 24rpx;
  color: #ff6a00;
  font-weight: 500;
  align-self: flex-end;
  text-align: right;
}

.countdown.started {
  color: #999;
  font-weight: 400;
}



.empty-tip {

  text-align: center;

  color: #999;

  font-size: 28rpx;

  padding: 80rpx 0;

}

</style>


