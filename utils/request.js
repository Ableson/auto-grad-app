import config from '@/config'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { toast, tansParams } from '@/utils/common'
import { handleHttp401 } from '@/utils/sessionExpire'

let timeout = 10000
const baseUrl = config.baseUrl

const request = config => {
  // headers.isToken === false 表示公开接口，不携带 token
  const skipToken = (config.headers || {}).isToken === false
  config.header = config.header || {}
  if (getToken() && !skipToken) {
    config.header['Authorization'] = 'Bearer ' + getToken()
  } else {
    delete config.header['Authorization']
  }
  // get请求映射params参数
  if (config.params) {
    let url = config.url + '?' + tansParams(config.params)
    url = url.slice(0, -1)
    config.url = url
  }
  return new Promise((resolve, reject) => {
    uni.request({
        method: config.method || 'get',
        timeout: config.timeout ||  timeout,
        url: config.baseUrl || baseUrl + config.url,
        data: config.data,
        header: config.header,
        dataType: 'json'
      }).then(response => {
        const res = response
        const code = res.data.code || 200
        const msg = errorCode[code] || res.data.msg || errorCode['default']
        if (code === 401) {
          if (skipToken) {
            toast(msg || '接口访问失败')
            reject('401')
            return
          }
          handleHttp401(skipToken)
          reject('无效的会话，或者会话已过期，请重新登录。')
        } else if (code === 500) {
          toast(msg)
          reject('500')
        } else if (code !== 200) {
          toast(msg)
          reject(code)
        }
        resolve(res.data)
      })
      .catch(error => {
        let message = (error && (error.message || error.errMsg)) || (typeof error === 'string' ? error : '') || '请求失败'
        if (message === 'Network Error') {
          message = '后端接口连接异常'
        } else if (message.includes('timeout')) {
          message = '系统接口请求超时'
        } else if (message.includes('Request failed with status code')) {
          message = '系统接口' + message.slice(-3) + '异常'
        }
        if (!config.silent) {
          toast(message)
        }
        reject(error)
      })
  })
}

export default request
