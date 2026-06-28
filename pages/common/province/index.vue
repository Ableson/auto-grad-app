<template>
  <view class="province-page">
    <view
      class="province-item national"
      :class="{ active: current === '' }"
      @click="selectNational"
    >
      全国
    </view>
    <view
      v-for="item in provinceList"
      :key="item"
      class="province-item"
      :class="{ active: item === current }"
      @click="selectProvince(item)"
    >
      {{ item }}
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { PROVINCE_LIST } from '@/utils/province'
import { resolveProvincePicker } from '@/utils/provincePicker'

const provinceList = PROVINCE_LIST
const current = ref('')

onLoad((options) => {
  current.value = options.current ? decodeURIComponent(options.current) : ''
})

function selectNational() {
  resolveProvincePicker('')
  uni.navigateBack()
}

function selectProvince(name) {
  resolveProvincePicker(name)
  uni.navigateBack()
}
</script>

<style scoped>
.province-page {
  padding: 20rpx 24rpx 40rpx;
  background: #fff;
  min-height: 100vh;
}

.province-item {
  padding: 24rpx 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 30rpx;
  color: #333;
}

.province-item.national {
  color: #2979ff;
  font-weight: 600;
}

.province-item.active {
  color: #2979ff;
  font-weight: 600;
}
</style>
