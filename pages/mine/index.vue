<template>
  <view class="mine-container" :style="{height: `${windowHeight}px`}">
    <view class="header-section">
      <view class="flex padding justify-between">
        <view class="flex align-center">
          <view v-if="!avatar" class="cu-avatar xl round bg-white">
            <view class="iconfont icon-people text-gray icon"></view>
          </view>
          <image v-if="avatar" @click="handleToAvatar" :src="avatar" class="cu-avatar xl round" mode="widthFix">
          </image>
          <view v-if="!name" @click="handleToLogin" class="login-tip">
            点击登录
          </view>
          <view v-if="name" @click="handleToInfo" class="user-info">
            <view class="u_title text-ellipsis">
              {{ displayName }}
            </view>
            <view v-if="needBindPhone" class="phone-tip" @click.stop="handleToEditInfo">
              请完善手机号
            </view>
          </view>
        </view>
        <view class="setting-entry" @click="handleToInfo">
          <uni-icons type="gear-filled" size="22" color="#ffffff"></uni-icons>
        </view>
      </view>
    </view>

    <view class="content-section">
      <view class="mine-actions grid col-4 text-center">
        <view class="action-item" @click="handleToFavorite">
          <view class="iconfont icon-aixin text-pink icon"></view>
          <text class="text">我的收藏</text>
        </view>
        <view class="action-item" @click="handleToBrowse">
          <view class="iconfont icon-version text-blue icon"></view>
          <text class="text">浏览足迹</text>
        </view>
        <view class="action-item" @click="handleBuilding">
          <view class="iconfont icon-service text-mauve icon"></view>
          <text class="text">敬请期待</text>
        </view>
        <view class="action-item" @click="handleBuilding">
          <view class="iconfont icon-community text-green icon"></view>
          <text class="text">敬请期待</text>
        </view>
      </view>

      <view class="menu-list">
        <view class="list-cell list-cell-arrow" @click="handleToEditInfo">
          <view class="menu-item-box">
            <view class="iconfont icon-user menu-icon"></view>
            <view>编辑资料</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import { useUserStore } from '@/store'
  import { computed , getCurrentInstance } from "vue"
  import { onShow } from '@dcloudio/uni-app'
  import { getToken } from '@/utils/auth'

  const { proxy } = getCurrentInstance()
  const userStore = useUserStore()
  const name = computed(() => userStore.name)
  const avatar = computed(() => userStore.avatar)

  function hasBoundPhone(phone) {
    return /^1\d{10}$/.test(phone || '')
  }

  const needBindPhone = computed(() => !hasBoundPhone(userStore.phone))
  const displayName = computed(() => {
    const value = name.value || ''
    if (/^1\d{10}$/.test(value)) {
      return value.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
    }
    return value
  })
  const windowHeight = computed(() => uni.getSystemInfoSync().windowHeight - 50)

  onShow(() => {
    if (getToken()) {
      userStore.getInfo().catch(() => {})
    }
  })

  function handleToInfo() {
    proxy.$tab.navigateTo('/pages/mine/info/index')
  }

  function handleToEditInfo() {
    proxy.$tab.navigateTo('/pages/mine/info/edit')
  }

  function handleToFavorite() {
    proxy.$tab.navigateTo('/pages/mine/behavior/index?type=favorite')
  }

  function handleToBrowse() {
    proxy.$tab.navigateTo('/pages/mine/behavior/index?type=browse')
  }

  function handleToLogin() {
    proxy.$tab.reLaunch('/pages/login')
  }

  function handleToAvatar() {
    proxy.$tab.navigateTo('/pages/mine/avatar/index')
  }

  function handleBuilding() {
    proxy.$modal.showToast('模块建设中~')
  }
</script>

<style lang="scss" scoped>
  page {
    background-color: #f5f6f7;
  }

  .mine-container {
    width: 100%;
    height: 100%;

    .header-section {
      padding: 15px 15px 45px 15px;
      background-color: #3c96f3;
      color: white;

      .login-tip {
        font-size: 18px;
        margin-left: 10px;
      }

      .setting-entry {
        padding: 8rpx;
      }

      .cu-avatar {
        border: 2px solid #eaeaea;

        .icon {
          font-size: 40px;
        }
      }

      .user-info {
        margin-left: 15px;
        flex: 1;
        min-width: 0;
        max-width: 420rpx;

        .u_title {
          font-size: 18px;
          line-height: 30px;
        }

        .text-ellipsis {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .phone-tip {
          margin-top: 4rpx;
          font-size: 24rpx;
          color: #ffe58f;
        }
      }
    }

    .content-section {
      position: relative;
      top: -50px;

      .mine-actions {
        margin: 15px 15px;
        padding: 20px 0px;
        border-radius: 8px;
        background-color: white;

        .action-item {
          .icon {
            font-size: 28px;
          }

          .text {
            display: block;
            font-size: 13px;
            margin: 8px 0px;
          }
        }
      }
    }
  }
</style>
