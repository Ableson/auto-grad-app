<template>

  <view class="page">

    <view class="header">

      <view class="top-row">

        <view class="location-main" @click="refreshLocation">

          <uni-icons type="location-filled" size="18" color="#2979ff"></uni-icons>

          <text class="location-value">{{ locationLabel }}</text>

          <uni-icons type="refreshempty" size="16" color="#999"></uni-icons>

        </view>

        <view class="menu-picker-wrap">
          <view
            v-if="menuDropdownOpen"
            class="menu-dropdown-mask"
            @click="closeMenuDropdown"
          ></view>
          <view class="menu-picker" @click.stop="toggleMenuDropdown">
            <text class="menu-picker-text">功能</text>
            <text class="menu-picker-arrow" :class="{ open: menuDropdownOpen }">▼</text>
          </view>
          <view v-if="menuDropdownOpen" class="menu-dropdown" @click.stop>
            <view
              v-for="item in menuActions"
              :key="item.action"
              class="menu-dropdown-item"
              @click.stop="selectMenuAction(item)"
            >
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

      </view>



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
      :lower-threshold="120"
      @scrolltolower="loadMore"
      @click="closeMenuDropdown(); showHistory = false"
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

        <image

          class="house-cover"

          :src="resolveFileUrl(item.imgPath) || '/static/logo.png'"

          mode="aspectFill"

        ></image>

        <view class="house-info">

          <text class="house-title">{{ item.title }}</text>

          <view class="house-meta">

            <text class="province">{{ item.provinceName }}</text>

            <text class="price">起拍 {{ item.startPrice }} 万</text>

          </view>

          <text class="time">开拍 {{ formatTime(item.startTime) }}</text>

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

  getLocalSearchHistory,

  saveLocalSearchHistory

} from '@/utils/searchHistory'

import {

  resolveCurrentProvince,

  chooseProvinceManually,

  getEffectiveLocation,

  setManualProvincePreference,

  clearManualProvincePreference,

  clearLocationCache

} from '@/utils/location'

import { isPickingProvince, finishProvincePicker } from '@/utils/provincePicker'

import { syncLocationToServer } from '@/utils/userLocation'



const MENU_ACTIONS = [

  { label: '切换省份', action: 'chooseProvince' },

  { label: '查看全国', action: 'viewNational' }

]



export default {

  data() {

    return {

      provinceName: '',

      searchKeyword: '',

      activeSearchValue: '',

      searchHistory: [],

      showHistory: false,

      houseList: [],

      total: 0,

      loading: false,

      loadingMore: false,

      locating: false,

      menuActions: MENU_ACTIONS,

      menuDropdownOpen: false,

      queryParams: {

        pageNum: 1,

        pageSize: 10,

        provinceName: '',

        searchValue: ''

      }

    }

  },

  computed: {

    locationLabel() {

      if (this.locating) return '定位中...'

      return this.provinceName || '全国'

    },

    listTitle() {

      const name = this.provinceName || '全国'

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

  },

  methods: {

    resolveFileUrl,

    formatTime(time) {

      if (!time) return '-'

      return String(time).replace('T', ' ').slice(0, 16)

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

    toggleMenuDropdown() {

      this.menuDropdownOpen = !this.menuDropdownOpen

    },

    closeMenuDropdown() {

      this.menuDropdownOpen = false

    },

    selectMenuAction(item) {

      this.menuDropdownOpen = false

      this.runMenuAction(item)

    },

    runMenuAction(item) {

      if (!item) return

      if (item.action === 'chooseProvince') this.chooseProvince()

      else if (item.action === 'viewNational') this.viewNational()

    },

    async applyLocation(forceRefresh = false) {

      const effective = getEffectiveLocation({ forceRefresh })

      if (effective) {

        this.provinceName = effective.provinceName

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

          this.provinceName = result.provinceName

        } else {

          uni.showToast({ title: '定位失败，已展示全国房源', icon: 'none' })

          this.provinceName = ''

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

    async chooseProvince() {

      try {

        const selected = await chooseProvinceManually(this.provinceName)

        this.provinceName = selected || ''

        setManualProvincePreference(this.provinceName)

        clearLocationCache()

        await this.loadList()

      } finally {

        finishProvincePicker()

      }

    },

    viewNational() {

      this.provinceName = ''

      setManualProvincePreference('')

      clearLocationCache()

      this.loadList()

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

      if (reset) {
        this.loading = true
        this.queryParams.pageNum = 1
      } else {
        this.loadingMore = true
      }

      try {

        this.queryParams.provinceName = this.provinceName || undefined

        this.queryParams.searchValue = this.activeSearchValue || undefined

        const res = await listAuction(this.queryParams)

        const rows = res.rows || []

        this.total = res.total || 0

        if (reset) {
          this.houseList = rows
        } else {
          this.houseList = this.houseList.concat(rows)
        }

      } catch (err) {

        console.error('房源列表加载失败', err)

      } finally {

        this.loading = false

        this.loadingMore = false

      }

    },

    loadMore() {
      if (!this.hasMore || this.loadingMore || this.loading) return
      this.queryParams.pageNum += 1
      this.loadList(false)
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

  padding: 20rpx 24rpx 16rpx;

  flex-shrink: 0;

  z-index: 10;

}



.top-row {

  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 20rpx;

}



.location-main {

  display: flex;

  align-items: center;

  flex: 1;

  min-width: 0;

  margin-right: 16rpx;

}



.location-value {

  margin-left: 8rpx;

  font-size: 28rpx;

  color: #333;

  font-weight: 600;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

}



.menu-picker-wrap {

  position: relative;

  flex-shrink: 0;

  z-index: 20;

}



.menu-dropdown-mask {

  position: fixed;

  left: 0;

  top: 0;

  right: 0;

  bottom: 0;

  z-index: 18;

}



.menu-picker {

  display: flex;

  align-items: center;

  padding: 10rpx 20rpx;

  background: #f5f8ff;

  border-radius: 28rpx;

  position: relative;

  z-index: 21;

}



.menu-picker-text {

  font-size: 26rpx;

  color: #2979ff;

  margin-right: 4rpx;

}



.menu-picker-arrow {

  font-size: 18rpx;

  color: #666;

  transition: transform 0.2s ease;

}



.menu-picker-arrow.open {

  transform: rotate(180deg);

}



.menu-dropdown {

  position: absolute;

  right: 0;

  top: calc(100% + 8rpx);

  min-width: 220rpx;

  background: #fff;

  border-radius: 16rpx;

  box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.12);

  overflow: hidden;

  z-index: 22;

}



.menu-dropdown-item {

  padding: 22rpx 28rpx;

  font-size: 26rpx;

  color: #333;

}



.menu-dropdown-item + .menu-dropdown-item {

  border-top: 1rpx solid #f0f0f0;

}



.menu-dropdown-item:active {

  background: #f5f8ff;

}



.search-row {

  display: flex;

  align-items: center;

}



.search-box {

  flex: 1;

  display: flex;

  align-items: center;

  background: #f5f6f7;

  border-radius: 32rpx;

  padding: 0 20rpx;

  height: 72rpx;

}



.search-input {

  flex: 1;

  margin-left: 12rpx;

  font-size: 28rpx;

  color: #333;

}



.search-btn {

  margin-left: 16rpx;

  font-size: 28rpx;

  color: #2979ff;

  flex-shrink: 0;

  padding: 0 8rpx;

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



.house-cover {

  width: 200rpx;

  height: 150rpx;

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



.province {

  font-size: 24rpx;

  color: #666;

}



.price {

  font-size: 28rpx;

  color: #e64340;

  font-weight: 600;

}



.time {

  font-size: 24rpx;

  color: #999;

}



.empty-tip {

  text-align: center;

  color: #999;

  font-size: 28rpx;

  padding: 80rpx 0;

}

</style>


