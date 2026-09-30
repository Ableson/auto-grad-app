<template>
  <view class="normal-login-container">
    <view class="logo-content align-center justify-center flex">
      <image style="width: 100rpx;height: 100rpx;" :src="globalConfig.appInfo.logo" mode="widthFix"></image>
      <text class="title">智汇拍品助手</text>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <view class="wx-login-content">
      <button
        class="wx-login-btn"
        open-type="getPhoneNumber"
        :loading="wxLoading"
        @getphonenumber="handleWxPhoneLogin"
      >
        微信一键登录
      </button>
      <view class="wx-login-tip">手机号未开通或未授权时，登录后可在个人信息中填写</view>
      <view class="toggle-pwd" @click="togglePwdLogin">
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

    <view v-if="showAgreementModal" class="agreement-mask" @click.stop="">
      <view class="agreement-dialog" @click.stop="">
        <view class="agreement-title">温馨提示</view>
        <view class="agreement-body">
          <text>您使用本应用前应当阅读并同意</text>
          <text class="text-blue" @click="handleUserAgrement">《用户协议》</text>
          <text class="text-blue" @click="handlePrivacy">《隐私协议》</text>
          <text>当您点击同意并开始使用产品服务时，即表示你已理解并同意。</text>
        </view>
        <view class="agreement-actions">
          <button class="agreement-btn agreement-btn-cancel" @click="handleAgreementReject">不同意</button>
          <button class="agreement-btn agreement-btn-confirm" @click="handleAgreementAccept">同意并继续</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import { ref, computed, getCurrentInstance } from "vue"
  import { onLoad } from "@dcloudio/uni-app"
  import { getToken } from '@/utils/auth'
  import { getCodeImg } from '@/api/login'
  import { useConfigStore, useUserStore, useAreaStore } from '@/store'
  import { syncLocationToServer } from '@/utils/userLocation'

  const { proxy } = getCurrentInstance()
  const globalConfig = useConfigStore().config
  const codeUrl = ref("")
  const captchaEnabled = ref(true)
  const wxLoading = ref(false)
  const showPwdLogin = ref(false)
  const showAgreementModal = ref(false)

  const AGREEMENT_ACCEPTED_KEY = 'app_user_agreement_accepted'

  function hasAcceptedAgreement() {
    return uni.getStorageSync(AGREEMENT_ACCEPTED_KEY) === '1'
  }

  function openAgreementModalIfNeeded() {
    if (!hasAcceptedAgreement()) {
      showAgreementModal.value = true
    }
  }

  function ensureAgreementAccepted() {
    if (!hasAcceptedAgreement()) {
      showAgreementModal.value = true
      return false
    }
    return true
  }

  function handleAgreementAccept() {
    uni.setStorageSync(AGREEMENT_ACCEPTED_KEY, '1')
    showAgreementModal.value = false
  }

  function handleAgreementReject() {
    // #ifdef MP-WEIXIN
    uni.exitMiniProgram({})
    // #endif
    // #ifndef MP-WEIXIN
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack()
    } else {
      proxy.$modal.msg('需同意协议后方可使用本应用')
    }
    // #endif
  }

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
    proxy.$tab.navigateTo('/pages/protocol/index')
  }

  function handleUserAgrement() {
    proxy.$tab.navigateTo('/pages/protocol/index')
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

  function togglePwdLogin() {
    if (!ensureAgreementAccepted()) return
    showPwdLogin.value = !showPwdLogin.value
    if (showPwdLogin.value) {
      getCode()
    }
  }

  async function handleWxPhoneLogin(e) {
    if (!ensureAgreementAccepted()) return
    if (wxLoading.value) return
    const detail = e.detail || {}
    const phoneGranted = detail.errMsg && detail.errMsg.indexOf('ok') !== -1 && detail.code
    const phoneCode = phoneGranted ? detail.code : ''

    wxLoading.value = true
    proxy.$modal.loading("登录中...")
    try {
      await useUserStore().wxLogin({ phoneCode })
      await loginSuccess()
      const userStore = useUserStore()
      if (!userStore.phone) {
        proxy.$modal.msg(phoneCode
          ? '手机号自动绑定失败，请在「编辑资料」中手动填写'
          : '未获取手机号，请稍后在「编辑资料」中完善')
      }
    } catch (err) {
      console.error('微信登录失败', err)
    } finally {
      wxLoading.value = false
      proxy.$modal.closeLoading()
    }
  }

  async function handleLogin() {
    if (!ensureAgreementAccepted()) return
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
    return useUserStore().getInfo().then(async () => {
      await useAreaStore().loadAreaOnce().catch(() => {})
      await syncLocationToServer().catch(() => {})
      proxy.$tab.reLaunch('/pages/index')
    })
  }

  onLoad(() => {
    if (getToken()) {
      proxy.$tab.reLaunch('/pages/index')
      return
    }
    openAgreementModalIfNeeded()
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

    .wx-login-tip {
      margin-top: 20rpx;
      font-size: 22rpx;
      color: #999;
      line-height: 1.6;
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

    .agreement-mask {
      position: fixed;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48rpx;
      box-sizing: border-box;
    }

    .agreement-dialog {
      width: 100%;
      max-width: 620rpx;
      background: #fff;
      border-radius: 24rpx;
      overflow: hidden;
    }

    .agreement-title {
      padding: 36rpx 32rpx 16rpx;
      font-size: 34rpx;
      font-weight: 600;
      text-align: center;
      color: #333;
    }

    .agreement-body {
      padding: 16rpx 32rpx 32rpx;
      font-size: 28rpx;
      line-height: 1.75;
      color: #666;
      text-align: justify;
    }

    .agreement-actions {
      display: flex;
      border-top: 1rpx solid #eee;
    }

    .agreement-btn {
      flex: 1;
      margin: 0;
      padding: 0;
      height: 96rpx;
      line-height: 96rpx;
      font-size: 30rpx;
      border-radius: 0;
      background: #fff;
    }

    .agreement-btn::after {
      border: none;
    }

    .agreement-btn-cancel {
      color: #666;
      border-right: 1rpx solid #eee;
    }

    .agreement-btn-confirm {
      color: #007aff;
      font-weight: 600;
    }
  }
</style>
