import request from '@/utils/request'

// 登录方法
export function login(username, password, code, uuid) {
  const data = {
    username,
    password,
    code,
    uuid
  }
  return request({
    'url': '/login',
    headers: {
      isToken: false
    },
    'method': 'post',
    'data': data
  })
}

/** 微信小程序一键登录（优先自动获取手机号，未开通或未授权时可登录后手动填写） */
export function wxLogin(code, profile = {}) {
  return request({
    url: '/house/wechat/login',
    method: 'post',
    headers: {
      isToken: false
    },
    data: {
      code,
      phoneCode: profile.phoneCode || '',
      avatarUrl: profile.avatarUrl || ''
    }
  })
}

// 注册方法
export function register(data) {
  return request({
    url: '/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    'url': '/getInfo',
    'method': 'get'
  })
}

// 退出方法
export function logout() {
  return request({
    'url': '/logout',
    'method': 'post'
  })
}

// 获取验证码
export function getCodeImg() {
  return request({
    'url': '/captchaImage',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}
