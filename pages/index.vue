<template>
  <view class="page">
    <view class="header">
      <view class="location-row">
        <view class="location-main" @click="refreshLocation">
          <uni-icons type="location-filled" size="20" color="#2979ff"></uni-icons>
          <text class="location-label">当前位置：</text>
          <text class="location-value">{{ locationLabel }}</text>
          <uni-icons type="refreshempty" size="18" color="#999"></uni-icons>
        </view>
        <text v-if="provinceName" class="clear-btn" @click="viewNational">全国</text>
      </view>
    </view>

    <uni-section title="功能菜单" type="line"></uni-section>
    <view class="menu-grid">
      <view class="menu-item" @click="goMap">
        <view class="menu-icon map-icon">
          <uni-icons type="map-filled" size="32" color="#2979ff"></uni-icons>
        </view>
        <text class="menu-text">地图找房</text>
      </view>
      <view class="menu-item" @click="chooseProvince">
        <view class="menu-icon">
          <uni-icons type="list" size="32" color="#18bc37"></uni-icons>
        </view>
        <text class="menu-text">切换省份</text>
      </view>
      <view class="menu-item" @click="viewNational">
        <view class="menu-icon nation-icon">
          <uni-icons type="home-filled" size="32" color="#ff9900"></uni-icons>
        </view>
        <text class="menu-text">查看全国</text>
      </view>
    </view>

    <uni-section :title="listTitle" type="line"></uni-section>

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
          :src="item.imgPath || '/static/logo.png'"
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
    </view>
  </view>
</template>

<script>
import { listAuction } from '@/api/auction'
import {
  resolveCurrentProvince,
  chooseProvinceManually,
  getEffectiveLocation,
  setManualProvincePreference,
  clearManualProvincePreference,
  clearLocationCache
} from '@/utils/location'
import { isPickingProvince, finishProvincePicker } from '@/utils/provincePicker'

export default {
  data() {
    return {
      provinceName: '',
      houseList: [],
      total: 0,
      loading: false,
      locating: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        provinceName: ''
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
      return `${name} 拍卖房源（共 ${this.total} 条）`
    }
  },
  onLoad() {
    this.applyLocation(false)
  },
  onShow() {
    if (isPickingProvince()) return
  },
  methods: {
    formatTime(time) {
      if (!time) return '-'
      return String(time).replace('T', ' ').slice(0, 16)
    },
    async applyLocation(forceRefresh = false) {
      const effective = getEffectiveLocation({ forceRefresh })
      if (effective) {
        this.provinceName = effective.provinceName
        await this.loadList()
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
    async loadList() {
      this.loading = true
      try {
        this.queryParams.provinceName = this.provinceName || undefined
        this.queryParams.pageNum = 1
        const res = await listAuction(this.queryParams)
        this.houseList = res.rows || []
        this.total = res.total || 0
      } catch (err) {
        console.error('房源列表加载失败', err)
      } finally {
        this.loading = false
      }
    },
    goMap() {
      const province = this.provinceName ? `?provinceName=${encodeURIComponent(this.provinceName)}` : ''
      uni.navigateTo({
        url: `/pages/house/map${province}`
      })
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
  min-height: 100vh;
  background: #f5f6f7;
  padding-bottom: 30rpx;
}

.header {
  background: #fff;
  padding: 24rpx;
}

.location-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.location-main {
  display: flex;
  align-items: center;
  flex: 1;
}

.location-label {
  margin-left: 8rpx;
  font-size: 28rpx;
  color: #666;
}

.location-value {
  margin-left: 8rpx;
  font-size: 30rpx;
  color: #333;
  font-weight: 600;
}

.clear-btn {
  margin-left: 16rpx;
  font-size: 26rpx;
  color: #2979ff;
  flex-shrink: 0;
}

.menu-grid {
  display: flex;
  background: #fff;
  padding: 20rpx 24rpx 30rpx;
}

.menu-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  background: #f5f8ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-icon {
  background: #eef4ff;
}

.nation-icon {
  background: #fff7e8;
}

.menu-text {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #333;
}

.house-list {
  padding: 0 24rpx;
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
