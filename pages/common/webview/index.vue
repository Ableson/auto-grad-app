<template>
  <view class="webview-page">
    <web-view v-if="webUrl" :src="webUrl" @error="handleWebError"></web-view>
    <view v-else class="fallback-panel">
      <text class="fallback-title">{{ loadError ? '页面无法打开' : '链接无效' }}</text>
      <text class="fallback-desc">
        法拍原站链接较长，或需在小程序后台配置业务域名。可复制后在浏览器中打开。
      </text>
      <button v-if="fallbackUrl" class="copy-btn" @click="handleCopy">复制链接</button>
      <button class="back-btn" @click="handleBack">返回</button>
    </view>
  </view>
</template>

<script>
import { copyWebViewUrl, readStoredWebViewUrl } from '@/utils/webview'

export default {
  data() {
    return {
      webUrl: '',
      fallbackUrl: '',
      loadError: false
    }
  },
  onLoad(event) {
    let target = ''
    if (event.from === 'storage') {
      target = readStoredWebViewUrl()
    } else if (event.url) {
      try {
        target = decodeURIComponent(event.url)
      } catch (e) {
        target = event.url
      }
    }
    this.fallbackUrl = target
    if (event.title) {
      try {
        uni.setNavigationBarTitle({
          title: decodeURIComponent(event.title)
        })
      } catch (e) {
        uni.setNavigationBarTitle({ title: event.title })
      }
    }
    if (target) {
      this.webUrl = target
    }
  },
  methods: {
    handleWebError() {
      this.loadError = true
      this.webUrl = ''
    },
    handleCopy() {
      copyWebViewUrl(this.fallbackUrl)
    },
    handleBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.webview-page {
  width: 100%;
  height: 100vh;
}

.fallback-panel {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  box-sizing: border-box;
  background: #f5f6f7;
}

.fallback-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.fallback-desc {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #666;
  line-height: 1.7;
  text-align: center;
}

.copy-btn,
.back-btn {
  width: 100%;
  max-width: 520rpx;
  margin-top: 32rpx;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 42rpx;
  font-size: 30rpx;
}

.copy-btn {
  background: #2979ff;
  color: #fff;
}

.back-btn {
  background: #fff;
  color: #666;
}

.copy-btn::after,
.back-btn::after {
  border: none;
}
</style>
