/**
 * 调起微信小程序支付
 * @param {Object} payParams 后端返回的 payParams
 */
export function requestWechatPay(payParams = {}) {
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: String(payParams.timeStamp || ''),
      nonceStr: payParams.nonceStr || '',
      package: payParams.packageValue || payParams.package || '',
      signType: payParams.signType || 'MD5',
      paySign: payParams.paySign || '',
      success: () => resolve(),
      fail: (err) => {
        const msg = (err && err.errMsg) || ''
        if (msg.includes('cancel')) {
          reject(new Error('cancel'))
          return
        }
        reject(err || new Error('支付失败'))
      }
    })
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 支付完成后轮询订单状态（应对回调延迟）
 */
export async function waitForMemberPaySuccess(queryFn, orderNo, maxRetry = 8) {
  for (let i = 0; i < maxRetry; i++) {
    const res = await queryFn(orderNo)
    if (res.paid) {
      return res
    }
    await sleep(1000)
  }
  throw new Error('支付确认中，请稍后在「我的」查看会员状态')
}
