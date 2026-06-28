<template>
  <view class="member-page">
    <view class="hero-card">
      <uni-icons type="vip-filled" size="48" color="#ffb020"></uni-icons>
      <text class="hero-title">开通会员</text>
      <text class="hero-desc">解锁法拍原站链接，快速跳转阿里/京东拍卖页面</text>
    </view>

    <view class="benefit-card">
      <view class="benefit-title">会员权益</view>
      <view class="benefit-item">
        <uni-icons type="checkmarkempty" size="18" color="#18bc37"></uni-icons>
        <text>查看并跳转法拍原站链接</text>
      </view>
      <view class="benefit-item">
        <uni-icons type="checkmarkempty" size="18" color="#18bc37"></uni-icons>
        <text>链接服务端加密保护，非会员无法获取</text>
      </view>
      <view class="benefit-item">
        <uni-icons type="checkmarkempty" size="18" color="#18bc37"></uni-icons>
        <text>更多房源高级功能持续更新</text>
      </view>
    </view>

    <view class="plan-card">
      <view class="plan-header">
        <text class="plan-name">月度会员</text>
        <view class="plan-price">
          <text class="price-symbol">¥</text>
          <text class="price-value">29</text>
          <text class="price-unit">/月</text>
        </view>
      </view>
      <text class="plan-tip">支付功能开发中，当前为体验开通</text>
    </view>

    <button class="purchase-btn" :loading="purchasing" @click="handlePurchase">
      立即开通
    </button>

    <text class="footer-tip">开通即表示同意《会员服务协议》</text>
  </view>
</template>

<script>
import { purchaseMember } from '@/api/member'
import { refreshMemberStatus } from '@/utils/member'
import { getToken } from '@/utils/auth'

export default {
  data() {
    return {
      dataId: '',
      purchasing: false
    }
  },
  onLoad(options) {
    this.dataId = options.dataId || ''
    if (!getToken()) {
      uni.showModal({
        title: '请先登录',
        content: '开通会员需要先登录账号',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: '/pages/login' })
          } else {
            uni.navigateBack()
          }
        }
      })
    }
  },
  methods: {
    async handlePurchase() {
      if (!getToken()) {
        uni.navigateTo({ url: '/pages/login' })
        return
      }
      if (this.purchasing) return
      this.purchasing = true
      try {
        await purchaseMember()
        await refreshMemberStatus()
        uni.showToast({ title: '开通成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/mine/index' }) })
        }, 1200)
      } catch (err) {
        console.error('开通会员失败', err)
      } finally {
        this.purchasing = false
      }
    }
  }
}
</script>

<style scoped>
.member-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff7e8 0%, #f5f6f7 280rpx);
  padding: 32rpx 24rpx 60rpx;
  box-sizing: border-box;
}

.hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 176, 32, 0.12);
}

.hero-title {
  margin-top: 16rpx;
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}

.hero-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #888;
  text-align: center;
  line-height: 1.6;
}

.benefit-card,
.plan-card {
  margin-top: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
}

.benefit-title,
.plan-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #555;
}

.plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.plan-price {
  display: flex;
  align-items: baseline;
  color: #e64340;
}

.price-symbol {
  font-size: 28rpx;
}

.price-value {
  font-size: 48rpx;
  font-weight: 700;
}

.price-unit {
  font-size: 24rpx;
  color: #999;
}

.plan-tip {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #999;
}

.purchase-btn {
  margin-top: 48rpx;
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 46rpx;
  background: linear-gradient(135deg, #ffb020, #ff8c00);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
}

.purchase-btn::after {
  border: none;
}

.footer-tip {
  display: block;
  margin-top: 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: #bbb;
}
</style>
