/** 将后端时间字符串解析为毫秒时间戳（兼容 iOS） */
export function parseTimeToMs(time) {
  if (!time) return NaN
  const normalized = String(time).trim().replace('T', ' ').replace(/-/g, '/')
  const ms = new Date(normalized).getTime()
  return Number.isFinite(ms) ? ms : NaN
}

/** 根据列表响应里的 serverTime 计算与本地时间的偏移量 */
export function calcServerOffset(serverTime) {
  const serverMs = parseTimeToMs(serverTime)
  if (Number.isNaN(serverMs)) return 0
  return serverMs - Date.now()
}

/** 基于服务端偏移量，得到当前「服务端时间」毫秒值 */
export function getServerNowMs(serverOffset = 0) {
  return Date.now() + (serverOffset || 0)
}

const pad2 = (n) => String(n).padStart(2, '0')

/**
 * 距开拍倒计时文案
 * @param {string|number} startTime 开拍时间
 * @param {number} serverOffset 服务端与本地时间差（ms）
 */
export function formatCountdownToStart(startTime, serverOffset = 0) {
  const startMs = parseTimeToMs(startTime)
  if (Number.isNaN(startMs)) return ''

  const diff = startMs - getServerNowMs(serverOffset)
  if (diff <= 0) return '已开拍'

  const totalSec = Math.floor(diff / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  if (days > 0) {
    return `距开拍 ${days}天${pad2(hours)}时${pad2(minutes)}分${pad2(seconds)}秒`
  }
  if (hours > 0) {
    return `距开拍 ${hours}时${pad2(minutes)}分${pad2(seconds)}秒`
  }
  return `距开拍 ${minutes}分${pad2(seconds)}秒`
}

/** 开拍时间 +1 天仍早于服务端当前时间则视为已结束 */
export function isAuctionEndedByStartTime(startTime, serverOffset = 0) {
  const startMs = parseTimeToMs(startTime)
  if (Number.isNaN(startMs)) return false
  return getServerNowMs(serverOffset) >= startMs + 86400000
}

/** 启动每秒 tick，返回停止函数 */
export function startCountdownTicker(onTick) {
  const timer = setInterval(onTick, 1000)
  return () => clearInterval(timer)
}
