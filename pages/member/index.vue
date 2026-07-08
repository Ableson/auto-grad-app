<template>
  <view class="member-page">
    <view class="hero-card">
      <uni-icons type="vip-filled" size="48" color="#2979ff"></uni-icons>
      <text class="hero-title">开通会员</text>
      <text class="hero-desc">{{ heroDesc }}</text>
    </view>

    <view class="benefit-card">
      <view class="benefit-title">会员权益</view>
      <view class="benefit-item">
        <uni-icons type="checkmarkempty" size="18" color="#18bc37"></uni-icons>
        <text>{{ pathName || '会员专属功能' }}</text>
      </view>
      <view class="benefit-item">
        <uni-icons type="checkmarkempty" size="18" color="#18bc37"></uni-icons>
        <text>专属昵称颜色与头像标识</text>
      </view>
      <view class="benefit-item">
        <uni-icons type="checkmarkempty" size="18" color="#18bc37"></uni-icons>
        <text>更多房源高级功能持续更新</text>
      </view>
    </view>

    <view v-if="plans.length" class="plan-list">
      <view
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card"
        :class="{ active: selectedPlanId === plan.id }"
        @click="selectedPlanId = plan.id"
      >
        <view class="plan-header">
          <text class="plan-name">{{ plan.planName }}</text>
          <view class="plan-price">
            <text class="price-symbol">¥</text>
            <text class="price-value">{{ plan.price }}</text>
          </view>
        </view>
        <text class="plan-tip">{{ planTip(plan) }}</text>
      </view>
    </view>
    <view v-else class="empty-tip">暂无可购买的会员套餐</view>

    <button v-if="plans.length" class="purchase-btn" :loading="purchasing" @click="handlePurchase">
      立即开通
    </button>

    <text class="footer-tip">支付成功后会员权益立即生效</text>
  </view>
</template>

<script>
import { getMemberPlans, createMemberPayOrder, queryMemberPayOrder, getMemberFeatureAccess } from '@/api/member'
import { refreshMemberStatus } from '@/utils/member'
import { getToken } from '@/utils/auth'
import { requestWechatPay, waitForMemberPaySuccess } from '@/utils/wxPay'

export default {
  data() {
    return {
      dataId: '',
      apiPath: '',
      apiMethod: 'GET',
      planType: '',
      pathName: '',
      plans: [],
      selectedPlanId: null,
      purchasing: false
    }
  },
  computed: {
    heroDesc() {
      if (this.pathName) {
        return `开通会员后可使用：${this.pathName}`
      }
      return '开通会员，享受更多专属权益'
    }
  },
  async onLoad(options) {
    this.dataId = options.dataId || ''
    this.apiPath = options.path ? decodeURIComponent(options.path) : ''
    this.apiMethod = options.method || 'GET'
    this.planType = options.planType || ''
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
      return
    }
    await this.resolvePlanContext()
    uni.setNavigationBarTitle({ title: this.pathName ? `开通${this.pathName}` : '开通会员' })
    this.loadPlans()
  },
  methods: {
    async resolvePlanContext() {
      if (this.apiPath) {
        try {
          const res = await getMemberFeatureAccess({
            path: this.apiPath,
            method: this.apiMethod
          })
          const data = res.data || res
          this.planType = data.planType || this.planType
          this.pathName = data.pathName || ''
        } catch (err) {
          console.error('解析会员路径失败', err)
        }
      }
      if (!this.planType) {
        this.planType = 'general'
      }
    },
    planTip(plan) {
      if (plan.days < 0) return '永久有效'
      return `${plan.days} 天有效`
    },
    async loadPlans() {
      try {
        const res = await getMemberPlans(this.planType)
        this.plans = res.data || []
        if (this.plans.length) {
          this.selectedPlanId = this.plans[0].id
        } else {
          uni.showToast({ title: '暂无可购买套餐', icon: 'none' })
          setTimeout(() => {
            uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/mine/index' }) })
          }, 1200)
        }
      } catch (err) {
        console.error('加载套餐失败', err)
      }
    },
    async handlePurchase() {
      if (!getToken()) {
        uni.navigateTo({ url: '/pages/login' })
        return
      }
      if (!this.selectedPlanId) {
        uni.showToast({ title: '请选择套餐', icon: 'none' })
        return
      }
      if (this.purchasing) return
      this.purchasing = true
      try {
        const res = await createMemberPayOrder(this.selectedPlanId)
        if (res.paid) {
          await refreshMemberStatus()
          uni.showToast({ title: '开通成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/mine/index' }) })
          }, 1200)
          return
        }
        const payParams = res.payParams
        if (!payParams) {
          uni.showToast({ title: '获取支付参数失败', icon: 'none' })
          return
        }
        await requestWechatPay(payParams)
        await waitForMemberPaySuccess(queryMemberPayOrder, res.orderNo)
        await refreshMemberStatus()
        uni.showToast({ title: '开通成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/mine/index' }) })
        }, 1200)
      } catch (err) {
        const msg = err && err.message ? err.message : ''
        if (msg === 'cancel') {
          uni.showToast({ title: '已取消支付', icon: 'none' })
        } else if (msg) {
          uni.showToast({ title: msg, icon: 'none' })
        }
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
  background: linear-gradient(180deg, #eef4ff 0%, #f5f6f7 280rpx);
  padding: 32rpx 24rpx 60rpx;
}

.hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(41, 121, 255, 0.08);
}

.hero-title {
  margin-top: 16rpx;
  font-size: 40rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.hero-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #666;
  text-align: center;
}

.benefit-card {
  margin-top: 24rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 24rpx;
}

.benefit-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  color: #555;
}

.plan-list {
  margin-top: 24rpx;
}

.plan-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid transparent;
}

.plan-card.active {
  border-color: #2979ff;
  background: #f5f9ff;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.plan-price {
  display: flex;
  align-items: baseline;
  color: #2979ff;
}

.price-symbol {
  font-size: 24rpx;
}

.price-value {
  font-size: 40rpx;
  font-weight: 700;
}

.plan-tip {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
}

.empty-tip {
  text-align: center;
  color: #999;
  font-size: 28rpx;
  padding: 48rpx 0;
}

.purchase-btn {
  margin-top: 32rpx;
  background: #2979ff;
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
  height: 88rpx;
  line-height: 88rpx;
}

.footer-tip {
  display: block;
  text-align: center;
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #999;
}
</style>
