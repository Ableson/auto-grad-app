import { ref, onUnmounted } from 'vue'
import {
  calcServerOffset,
  formatCountdownToStart,
  startCountdownTicker
} from '@/utils/auctionCountdown'

/** 列表页开拍倒计时：拉取列表时同步 serverTime，本地每秒刷新 */
export function useAuctionCountdown() {
  const serverOffset = ref(0)
  const tick = ref(0)
  let stopTicker = null

  function applyServerTime(serverTime) {
    if (serverTime) {
      serverOffset.value = calcServerOffset(serverTime)
    }
  }

  function startTicker() {
    stopTicker?.()
    stopTicker = startCountdownTicker(() => {
      tick.value += 1
    })
  }

  function stopCountdown() {
    stopTicker?.()
    stopTicker = null
  }

  onUnmounted(stopCountdown)

  function countdownText(startTime) {
    void tick.value
    return formatCountdownToStart(startTime, serverOffset.value)
  }

  return {
    applyServerTime,
    startTicker,
    stopCountdown,
    countdownText
  }
}
