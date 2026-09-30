<template>
  <view class="setting-container" :style="{height: `${windowHeight}px`}">
    <view class="menu-list">
      <view class="list-cell list-cell-arrow" @click="handleToPwd">
        <view class="menu-item-box">
          <view class="iconfont icon-password menu-icon"></view>
          <view>修改密码</view>
        </view>
      </view>
      <view class="list-cell list-cell-arrow" @click="handleToUpgrade">
        <view class="menu-item-box">
          <view class="iconfont icon-refresh menu-icon"></view>
          <view>检查更新</view>
        </view>
      </view>
      <view class="list-cell list-cell-arrow" @click="handleCleanTmp">
        <view class="menu-item-box">
          <view class="iconfont icon-clean menu-icon"></view>
          <view>清理缓存</view>
        </view>
      </view>
      <view class="list-cell">
        <view class="menu-item-box push-pref-row">
          <view class="iconfont icon-notification menu-icon"></view>
          <view class="push-pref-label">新房源提醒</view>
          <switch :checked="pushEnabled" @change="onPushPrefChange" color="#2979ff" />
        </view>
      </view>
    </view>
    <view class="cu-list menu">
      <view class="cu-item item-box">
        <view class="content text-center" @click="handleLogout">
          <text class="text-black">退出登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import { useUserStore } from '@/store'
  import { ref, computed , getCurrentInstance } from "vue"
  import { onShow } from '@dcloudio/uni-app'
  import { getPushPref, updatePushPref } from '@/api/push'
  import { requestListingPushSubscribe } from '@/utils/pushSubscribe'

  const { proxy } = getCurrentInstance()
  const windowHeight = computed(() => uni.getSystemInfoSync().windowHeight - 50)
  const pushEnabled = ref(false)

  onShow(() => {
    getPushPref().then(res => {
      const data = res.data || res
      pushEnabled.value = !!data.enabled
    }).catch(() => {})
  })

  async function onPushPrefChange(e) {
    const enabled = !!e.detail.value
    pushEnabled.value = enabled
    try {
      if (enabled) {
        await requestListingPushSubscribe({ agency: true, user: true })
      }
      await updatePushPref({ enabled })
      proxy.$modal.showToast(enabled ? '已开启新房源提醒' : '已关闭')
    } catch (err) {
      pushEnabled.value = !enabled
      proxy.$modal.showToast('设置失败')
    }
  }

  function handleToPwd() {
    proxy.$tab.navigateTo('/pages/mine/pwd/index')
  }

  function handleToUpgrade() {
    proxy.$modal.showToast('模块建设中~')
  }

  function handleCleanTmp() {
    proxy.$modal.showToast('模块建设中~')
  }

  function handleLogout() {
    proxy.$modal.confirm('确定注销并退出系统吗？').then(() => {
      useUserStore().logOut().then(() => {}).finally(()=>{
        proxy.$tab.reLaunch('/pages/index')
      })
    })
  }
</script>

<style lang="scss" scoped>
  .page {
    background-color: #f8f8f8;
  }

  .push-pref-row {
    width: 100%;
    justify-content: space-between;
  }
  .push-pref-label {
    flex: 1;
    margin-left: 8rpx;
  }
  .item-box {
    background-color: #FFFFFF;
    margin: 30rpx;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 10rpx;
    border-radius: 8rpx;
    color: #303133;
    font-size: 32rpx;
  }
</style>
