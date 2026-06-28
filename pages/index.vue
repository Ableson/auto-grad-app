<template>
  <view class="page">
    <view class="header">
      <view class="location-row" @click="refreshLocation">
        <uni-icons type="location-filled" size="20" color="#2979ff"></uni-icons>
        <text class="location-label">当前位置：</text>
        <text class="location-value">{{ provinceName || '点击获取定位' }}</text>
        <uni-icons type="refreshempty" size="18" color="#999"></uni-icons>
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
    </view>

    <uni-section :title="listTitle" type="line"></uni-section>

    <view class="house-list">
      <view v-if="loading && houseList.length === 0" class="empty-tip">加载中...</view>
      <view v-else-if="!provinceName" class="empty-tip">请先获取定位或选择省份</view>
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
import { getCurrentProvinceName, chooseProvinceManually } from '@/utils/location'
import { isPickingProvince, finishProvincePicker } from '@/utils/provincePicker'

export default {
  data() {
    return {
      provinceName: '',
      houseList: [],
      total: 0,
      loading: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        provinceName: ''
      }
    }
  },
  onShow() {
    if (isPickingProvince()) return
    if (!this.provinceName) {
      this.refreshLocation()
    }
  },
  computed: {
    listTitle() {
      const name = this.provinceName || '全国'
      return `${name} 拍卖房源（共 ${this.total} 条）`
    }
  },
  methods: {
    formatTime(time) {
      if (!time) return '-'
      return String(time).replace('T', ' ').slice(0, 16)
    },
    async refreshLocation() {
      uni.showLoading({ title: '定位中...' })
      try {
        const result = await getCurrentProvinceName()
        this.provinceName = result.provinceName
        await this.loadList()
      } finally {
        finishProvincePicker()
        uni.hideLoading()
      }
    },
    async chooseProvince() {
      try {
        this.provinceName = await chooseProvinceManually(this.provinceName)
        await this.loadList()
      } finally {
        finishProvincePicker()
      }
    },
    async loadList() {
      if (!this.provinceName) return
      this.loading = true
      try {
        this.queryParams.provinceName = this.provinceName
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
      if (item.detailUrl) {
        uni.navigateTo({
          url: `/pages/common/webview/index?url=${encodeURIComponent(item.detailUrl)}`
        })
      }
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
}

.location-label {
  margin-left: 8rpx;
  font-size: 28rpx;
  color: #666;
}

.location-value {
  flex: 1;
  margin-left: 8rpx;
  font-size: 30rpx;
  color: #333;
  font-weight: 600;
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

.menu-text {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #333;
}

.total-text {
  font-size: 24rpx;
  color: #999;
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
