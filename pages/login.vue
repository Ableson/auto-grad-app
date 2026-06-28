<template>
  <view class="normal-login-container">
    <view class="logo-content align-center justify-center flex">
      <image style="width: 100rpx;height: 100rpx;" :src="globalConfig.appInfo.logo" mode="widthFix"></image>
      <text class="title">法拍房源</text>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <view class="wx-login-content">
      <button class="wx-login-btn" :loading="wxLoading" @click="handleWxLogin">
        微信一键登录
      </button>
      <view class="toggle-pwd" @click="showPwdLogin = !showPwdLogin">
        <text>{{ showPwdLogin ? '收起账号登录' : '使用账号密码登录' }}</text>
      </view>
    </view>
    <!-- #endif -->

    <view v-if="showLoginForm" class="login-form-content">
      <view class="input-item flex align-center">
        <view class="iconfont icon-user icon"></view>
        <input v-model="loginForm.username" class="input" type="text" placeholder="请输入账号" maxlength="30" />
      </view>
      <view class="input-item flex align-center">
        <view class="iconfont icon-password icon"></view>
        <input v-model="loginForm.password" type="password" class="input" placeholder="请输入密码" maxlength="20" />
      </view>
      <view class="input-item flex align-center" style="width: 60%;margin: 0px;" v-if="captchaEnabled">
        <view class="iconfont icon-code icon"></view>
        <input v-model="loginForm.code" type="number" class="input" placeholder="请输入验证码" maxlength="4" />
        <view class="login-code">
          <image :src="codeUrl" @click="getCode" class="login-code-img"></image>
        </view>
      </view>
      <view class="action-btn">
        <button @click="handleLogin" class="login-btn cu-btn block bg-blue lg round">登录</button>
      </view>
    </view>

    <view class="xieyi text-center">
      <text class="text-grey1">登录即代表同意</text>
      <text @click="handleUserAgrement" class="text-blue">《用户协议》</text>
      <text @click="handlePrivacy" class="text-blue">《隐私协议》</text>
    </view>
  </view>
</template>

<script setup>
  import { ref, computed, getCurrentInstance } from "vue"
  import { onLoad } from "@dcloudio/uni-app"
  import { getToken } from '@/utils/auth'
  import { getCodeImg } from '@/api/login'
  import { useConfigStore, useUserStore } from '@/store'

  const { proxy } = getCurrentInstance()
  const globalConfig = useConfigStore().config
  const codeUrl = ref("")
  const captchaEnabled = ref(true)
  const wxLoading = ref(false)
  const showPwdLogin = ref(false)

  // #ifndef MP-WEIXIN
  showPwdLogin.value = true
  // #endif

  const showLoginForm = computed(() => showPwdLogin.value)

  const loginForm = ref({
    username: "",
    password: "",
    code: "",
    uuid: ""
  })

  function handlePrivacy() {
    const site = globalConfig.appInfo.agreements[0]
    proxy.$tab.navigateTo(`/pages/common/webview/index?title=${site.title}&url=${site.url}`)
  }

  function handleUserAgrement() {
    const site = globalConfig.appInfo.agreements[1]
    proxy.$tab.navigateTo(`/pages/common/webview/index?title=${site.title}&url=${site.url}`)
  }

  function getCode() {
    getCodeImg().then(res => {
      captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
      if (captchaEnabled.value) {
        codeUrl.value = 'data:image/gif;base64,' + res.img
        loginForm.value.uuid = res.uuid
      }
    })
  }

  async function handleWxLogin() {
    if (wxLoading.value) return
    wxLoading.value = true
    proxy.$modal.loading("登录中...")
    try {
      await useUserStore().wxLogin()
      await loginSuccess()
    } catch (err) {
      console.error('微信登录失败', err)
    } finally {
      wxLoading.value = false
      proxy.$modal.closeLoading()
    }
  }

  async function handleLogin() {
    if (loginForm.value.username === "") {
      proxy.$modal.msgError("请输入账号")
    } else if (loginForm.value.password === "") {
      proxy.$modal.msgError("请输入密码")
    } else if (loginForm.value.code === "" && captchaEnabled.value) {
      proxy.$modal.msgError("请输入验证码")
    } else {
      proxy.$modal.loading("登录中，请耐心等待...")
      pwdLogin()
    }
  }

  async function pwdLogin() {
    useUserStore().login(loginForm.value).then(() => {
      proxy.$modal.closeLoading()
      loginSuccess()
    }).catch(() => {
      if (captchaEnabled.value) {
        getCode()
      }
    })
  }

  function loginSuccess() {
    return useUserStore().getInfo().then(() => {
      proxy.$tab.reLaunch('/pages/index')
    })
  }

  onLoad(() => {
    if (getToken()) {
      proxy.$tab.reLaunch('/pages/index')
      return
    }
    if (showPwdLogin.value) {
      getCode()
    }
  })
</script>

<style lang="scss" scoped>
  page {
    background-color: #ffffff;
  }

  .normal-login-container {
    width: 100%;

    .logo-content {
      width: 100%;
      font-size: 21px;
      text-align: center;
      padding-top: 15%;

      image {
        border-radius: 4px;
      }

      .title {
        margin-left: 10px;
      }
    }

    .wx-login-content {
      width: 80%;
      margin: 80rpx auto 0;
      text-align: center;
    }

    .wx-login-btn {
      height: 92rpx;
      line-height: 92rpx;
      border-radius: 46rpx;
      background: #07c160;
      color: #fff;
      font-size: 32rpx;
      font-weight: 600;
      border: none;
    }

    .wx-login-btn::after {
      border: none;
    }

    .toggle-pwd {
      margin-top: 28rpx;
      font-size: 26rpx;
      color: #666;
    }

    .login-form-content {
      text-align: center;
      margin: 20px auto;
      margin-top: 40rpx;
      width: 80%;

      .input-item {
        margin: 20px auto;
        background-color: #f5f6f7;
        height: 45px;
        border-radius: 20px;

        .icon {
          font-size: 38rpx;
          margin-left: 10px;
          color: #999;
        }

        .input {
          width: 100%;
          font-size: 14px;
          line-height: 20px;
          text-align: left;
          padding-left: 15px;
        }
      }

      .login-btn {
        margin-top: 40px;
        height: 45px;
      }

      .login-code {
        height: 38px;
        float: right;

        .login-code-img {
          height: 38px;
          position: absolute;
          margin-left: 10px;
          width: 200rpx;
        }
      }
    }

    .xieyi {
      color: #333;
      margin-top: 40rpx;
      text-align: center;
      width: 100%;
    }
  }
</style>
