<template>
  <view class="detail-page">
    <view v-if="loading" class="state-tip">加载中...</view>
    <view v-else-if="!detail" class="state-tip">暂无详情数据</view>
    <template v-else>
      <view class="hero">
        <swiper
          v-if="imageList.length"
          class="hero-swiper"
          circular
          indicator-dots
          indicator-color="rgba(255,255,255,0.5)"
          indicator-active-color="#ffffff"
          autoplay
          interval="4000"
        >
          <swiper-item v-for="(img, index) in imageList" :key="img.id || index">
            <image
              class="hero-cover"
              :src="img.fileUrl"
              mode="aspectFill"
              @click="previewImage(index)"
            ></image>
          </swiper-item>
        </swiper>
        <view v-else class="hero-cover hero-placeholder">
          <text class="placeholder-text">暂无图片</text>
        </view>
        <view class="hero-body">
          <view v-if="hasAuctionLink" class="auction-link-btn" :class="{ locked: !isMemberUser }" @click="openAuctionLink">
            <uni-icons type="vip-filled" size="14" :color="isMemberUser ? '#ffffff' : '#ffb020'"></uni-icons>
            <text class="hero-title">{{ pageTitle }}</text>
          </view>

          <view class="hero-tags">
            <text class="tag status">{{ statusLabel }}</text>
            <text v-if="detail.assetAddress" class="tag address">{{ detail.assetAddress }}</text>
          </view>
        </view>
      </view>

      <view class="info-card">
        <view class="info-row">
          <text class="label">当前价</text>
          <text class="value price">{{ formatYuan(detail.currentPriceYuan) }}</text>
        </view>
        <view class="info-row">
          <text class="label">起拍价</text>
          <text class="value">{{ formatYuan(detail.startPriceYuan) }}</text>
        </view>
        <view class="info-row">
          <text class="label">市场价</text>
          <text class="value">{{ formatYuan(detail.marketPriceYuan) }}</text>
        </view>
        <view class="info-row">
          <text class="label">保证金</text>
          <text class="value">{{ formatYuan(detail.depositYuan) }}</text>
        </view>
        <view class="info-row">
          <text class="label">加价幅度</text>
          <text class="value">{{ formatYuan(detail.priceStepYuan) }}</text>
        </view>
        <view class="info-row">
          <text class="label">延时周期</text>
          <text class="value">{{ detail.delayCycle || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="label">竞价周期</text>
          <text class="value">{{ detail.biddingCycle || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="label">围观次数</text>
          <text class="value">{{ detail.viewCountDetail ?? '-' }}</text>
        </view>
        <view class="info-row">
          <text class="label">提醒人数</text>
          <text class="value">{{ detail.remindCount ?? '-' }}</text>
        </view>
      </view>

      <view v-if="hasPayInfo" class="info-card">
        <view class="card-title">收款信息</view>
        <view class="info-row">
          <text class="label">户名</text>
          <text class="value">{{ detail.payAccountName || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="label">开户行</text>
          <text class="value">{{ detail.payBank || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="label">账号</text>
          <text class="value">{{ detail.payAccountNo || '-' }}</text>
        </view>
      </view>

      <view class="section-nav">
        <text
          v-for="item in navSections"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeSection === item.key }"
          @click="scrollToSection(item.key)"
        >
          {{ item.label }}
        </text>
      </view>

      <view class="section-wrap">
        <view
          v-for="item in textSections"
          :key="item.key"
          :id="item.key"
          class="section-block"
        >
          <view class="section-title">{{ item.label }}</view>
          <text class="section-content">{{ detail[item.field] || '暂无内容' }}</text>
        </view>

        <view v-if="attachmentList.length" id="attachments" class="section-block">
          <view class="section-title">相关附件</view>
          <view
            v-for="file in attachmentList"
            :key="file.id"
            class="attachment-item"
            @click="openAttachment(file)"
          >
            <uni-icons type="paperclip" size="18" color="#2979ff"></uni-icons>
            <view class="attachment-info">
              <text class="attachment-name">{{ file.fileName || '未命名附件' }}</text>
              <text class="attachment-meta">{{ getFileTypeText(file.fileType) }} · {{ file.fileSuffix || '-' }}</text>
            </view>
            <uni-icons type="right" size="16" color="#ccc"></uni-icons>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script>
import { listAuctionDetail } from '@/api/auctionDetail'
import { listAuctionFile } from '@/api/auctionFile'
import { getAuctionByDataId, getAuctionLink } from '@/api/auction'
import { getAuctionStatusLabel } from '@/utils/auctionStatus'
import { isMember, refreshMemberStatus, goMemberPurchase } from '@/utils/member'
import {
  FILE_TYPE_COVER,
  FILE_TYPE_DETAIL_IMAGE,
  FILE_TYPE_ATTACHMENT,
  getFileTypeText,
  isImageSuffix
} from '@/utils/fileType'

export default {
  data() {
    return {
      dataId: '',
      pageTitle: '标的详情',
      hasAuctionLink: false,
      isMemberUser: false,
      loading: true,
      detail: null,
      imageList: [],
      attachmentList: [],
      activeSection: 'assetIntro',
      textSections: [
        { key: 'assetIntro', label: '标的物介绍', field: 'assetIntro' },
        { key: 'bidNotice', label: '竞买公告', field: 'bidNotice' },
        { key: 'bidRule', label: '竞买须知', field: 'bidRule' }
      ]
    }
  },
  computed: {
    statusLabel() {
      return getAuctionStatusLabel(this.detail?.auctionStatus)
    },
    hasPayInfo() {
      if (!this.detail) return false
      return !!(this.detail.payAccountName || this.detail.payBank || this.detail.payAccountNo)
    },
    navSections() {
      const sections = [...this.textSections]
      if (this.attachmentList.length) {
        sections.push({ key: 'attachments', label: '相关附件' })
      }
      return sections
    }
  },
  onLoad(options) {
    this.dataId = options.dataId || ''
    this.pageTitle = options.title ? decodeURIComponent(options.title) : '标的详情'
    uni.setNavigationBarTitle({ title: '标的详情' })
    this.loadPageData()
    this.syncMemberStatus()
  },
  onShow() {
    this.syncMemberStatus()
  },
  methods: {
    async syncMemberStatus() {
      await refreshMemberStatus()
      this.isMemberUser = isMember()
    },
    getFileTypeText,
    formatYuan(value) {
      if (value === null || value === undefined || value === '') return '-'
      return `${value} 元`
    },
    scrollToSection(key) {
      this.activeSection = key
      uni.pageScrollTo({
        selector: `#${key}`,
        duration: 300
      })
    },
    previewImage(index) {
      uni.previewImage({
        current: index,
        urls: this.imageList.map(item => item.fileUrl)
      })
    },
    async openAuctionLink() {
      if (!this.hasAuctionLink) {
        uni.showToast({ title: '暂无法拍链接', icon: 'none' })
        return
      }
      await this.syncMemberStatus()
      if (!this.isMemberUser) {
        goMemberPurchase({ dataId: this.dataId })
        return
      }
      uni.showLoading({ title: '加载中...' })
      try {
        const res = await getAuctionLink(this.dataId)
        const url = res.url
        if (!url) {
          uni.showToast({ title: '暂无法拍链接', icon: 'none' })
          return
        }
        uni.navigateTo({
          url: `/pages/common/webview/index?url=${encodeURIComponent(url)}`
        })
      } catch (err) {
        console.error('获取法拍链接失败', err)
      } finally {
        uni.hideLoading()
      }
    },
    openAttachment(file) {
      if (!file?.fileUrl) return
      if (isImageSuffix(file.fileSuffix)) {
        uni.previewImage({ urls: [file.fileUrl] })
        return
      }
      uni.showLoading({ title: '打开中...' })
      uni.downloadFile({
        url: file.fileUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.openDocument({
              filePath: res.tempFilePath,
              showMenu: true,
              fail: () => {
                uni.showToast({ title: '暂不支持预览该格式', icon: 'none' })
              }
            })
          } else {
            uni.showToast({ title: '文件下载失败', icon: 'none' })
          }
        },
        fail: () => {
          uni.showToast({ title: '文件下载失败', icon: 'none' })
        },
        complete: () => {
          uni.hideLoading()
        }
      })
    },
    sortFiles(files) {
      return [...files].sort((a, b) => (a.sort || 0) - (b.sort || 0))
    },
    async loadPageData() {
      if (!this.dataId) {
        this.loading = false
        return
      }
      this.loading = true
      try {
        const [detailRes, fileRes, baseRes] = await Promise.all([
          listAuctionDetail({ dataId: this.dataId, pageNum: 1, pageSize: 1 }),
          listAuctionFile({ dataId: this.dataId, pageNum: 1, pageSize: 200 }),
          getAuctionByDataId(this.dataId)
        ])
        this.detail = (detailRes.rows && detailRes.rows[0]) || null
        this.hasAuctionLink = !!(baseRes.data && baseRes.data.hasAuctionLink)
        const files = this.sortFiles(fileRes.rows || [])
        this.imageList = files.filter(
          item => item.fileType === FILE_TYPE_COVER || item.fileType === FILE_TYPE_DETAIL_IMAGE
        )
        this.attachmentList = files.filter(item => item.fileType === FILE_TYPE_ATTACHMENT)
      } catch (err) {
        console.error('详情加载失败', err)
        this.detail = null
        this.hasAuctionLink = false
        this.imageList = []
        this.attachmentList = []
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f6f7;
  padding-bottom: 40rpx;
}

.state-tip {
  text-align: center;
  color: #999;
  font-size: 28rpx;
  padding: 120rpx 0;
}

.hero {
  background: #fff;
  padding: 24rpx;
}

.hero-swiper {
  width: 100%;
  height: 420rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.hero-cover {
  width: 100%;
  height: 420rpx;
  border-radius: 16rpx;
  background: #f0f0f0;
}

.hero-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  font-size: 28rpx;
  color: #999;
}

.hero-body {
  margin-top: 20rpx;
}

.hero-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.5;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.tag {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  color: #666;
}

.tag.status {
  background: #eef4ff;
  color: #2979ff;
}

.auction-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 5rpx;
  padding: 5rpx 5rpx;
  border-radius: 10rpx;
  background: linear-gradient(135deg, #2979ff, #1a5fd9);
}

.auction-link-btn.locked {
  background: #fff7e8;
  border: 1px solid #ffd591;
}

.auction-link-text {
  font-size: 22rpx;
  color: #fff;
  font-weight: 600;
}

.auction-link-btn.locked .auction-link-text {
  color: #d48806;
}

.member-badge {
  font-size: 18rpx;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  background: #ffb020;
  color: #fff;
}

.info-card {
  margin: 20rpx 24rpx 0;
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx 24rpx 16rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  padding: 16rpx 0 8rpx;
}

.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-size: 26rpx;
  color: #999;
  flex-shrink: 0;
  width: 160rpx;
}

.value {
  flex: 1;
  text-align: right;
  font-size: 26rpx;
  color: #333;
  word-break: break-all;
}

.value.price {
  color: #e64340;
  font-weight: 600;
}

.section-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 24rpx 24rpx 0;
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f5f6f7;
}

.nav-item {
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  color: #666;
  background: #fff;
  border-radius: 999rpx;
}

.nav-item.active {
  color: #2979ff;
  background: #eef4ff;
  font-weight: 600;
}

.section-wrap {
  padding: 0 24rpx;
}

.section-block {
  margin-top: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.section-content {
  display: block;
  font-size: 26rpx;
  color: #444;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.attachment-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.attachment-item:last-child {
  border-bottom: none;
}

.attachment-info {
  flex: 1;
  margin: 0 16rpx;
  min-width: 0;
}

.attachment-name {
  display: block;
  font-size: 28rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-meta {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #999;
}
</style>
