<template>
  <view class="info-page">
    <uni-section title="个人信息" type="line"></uni-section>
    <view class="profile-card">
      <uni-list>
        <uni-list-item showExtraIcon="true" :extraIcon="{type: 'person-filled'}" title="昵称" :rightText="user.nickName" />
        <uni-list-item showExtraIcon="true" :extraIcon="{type: 'phone-filled'}" title="手机号码" :rightText="user.phonenumber" />
        <uni-list-item showExtraIcon="true" :extraIcon="{type: 'email-filled'}" title="邮箱" :rightText="user.email" />
        <uni-list-item showExtraIcon="true" :extraIcon="{type: 'auth-filled'}" title="岗位" :rightText="postGroup" />
        <uni-list-item showExtraIcon="true" :extraIcon="{type: 'staff-filled'}" title="角色" :rightText="roleGroup" />
        <uni-list-item showExtraIcon="true" :extraIcon="{type: 'calendar-filled'}" title="创建日期" :rightText="user.createTime" />
      </uni-list>
    </view>

    <uni-section title="更多" type="line"></uni-section>
    <view class="grid-body">
      <uni-grid :column="4" :showBorder="false" @change="changeGrid">
        <uni-grid-item :index="0">
          <view class="grid-item-box">
            <uni-icons type="gear-filled" size="30" color="#2979ff"></uni-icons>
            <text class="text">应用设置</text>
          </view>
        </uni-grid-item>
        <uni-grid-item :index="1">
          <view class="grid-item-box">
            <uni-icons type="help-filled" size="30" color="#18bc37"></uni-icons>
            <text class="text">常见问题</text>
          </view>
        </uni-grid-item>
        <uni-grid-item :index="2">
          <view class="grid-item-box">
            <uni-icons type="info-filled" size="30" color="#ff9900"></uni-icons>
            <text class="text">关于我们</text>
          </view>
        </uni-grid-item>
        <uni-grid-item :index="3">
          <view class="grid-item-box">
            <uni-icons type="compose" size="30" color="#8799a3"></uni-icons>
            <text class="text">编辑资料</text>
          </view>
        </uni-grid-item>
      </uni-grid>
    </view>

    <view class="logout-box" @click="handleLogout">
      <text class="logout-text">退出登录</text>
    </view>
  </view>
</template>

<script setup>
  import { getUserProfile } from '@/api/system/user'
  import { useUserStore } from '@/store'
  import { ref, getCurrentInstance } from 'vue'
  import { onShow } from '@dcloudio/uni-app'
  import { getToken } from '@/utils/auth'

  const { proxy } = getCurrentInstance()
  const userStore = useUserStore()
  const user = ref({})
  const roleGroup = ref('')
  const postGroup = ref('')

  const gridRoutes = [
    '/pages/mine/setting/index',
    '/pages/mine/help/index',
    '/pages/mine/about/index',
    '/pages/mine/info/edit'
  ]

  function getUser() {
    if (!getToken()) return
    getUserProfile().then(response => {
      user.value = response.data || {}
      roleGroup.value = response.roleGroup || ''
      postGroup.value = response.postGroup || ''
      const phonenumber = user.value.phonenumber || ''
      if (phonenumber) {
        userStore.SET_PHONE(phonenumber)
      }
    })
  }

  function changeGrid(e) {
    const index = e.detail.index
    const url = gridRoutes[index]
    if (url) {
      proxy.$tab.navigateTo(url)
    }
  }

  function handleLogout() {
    proxy.$modal.confirm('确定注销并退出系统吗？').then(() => {
      userStore.logOut().finally(() => {
        proxy.$tab.reLaunch('/pages/login')
      })
    })
  }

  onShow(() => {
    getUser()
  })
</script>

<style lang="scss" scoped>
  page {
    background-color: #f5f6f7;
    min-height: 100%;
  }

  .info-page {
    padding-bottom: 40rpx;
  }

  .profile-card {
    margin: 0 24rpx;
    border-radius: 16rpx;
    overflow: hidden;
    background: #fff;
  }

  .grid-body {
    background: #fff;
    margin: 0 24rpx;
    border-radius: 16rpx;
    overflow: hidden;
  }

  .grid-item-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30rpx 0;
  }

  .text {
    text-align: center;
    font-size: 26rpx;
    margin-top: 10rpx;
    color: #333;
  }

  .logout-box {
    margin: 40rpx 24rpx 0;
    background: #fff;
    border-radius: 16rpx;
    padding: 28rpx 0;
    text-align: center;
  }

  .logout-text {
    font-size: 32rpx;
    color: #e64340;
  }
</style>
