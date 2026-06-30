<template>
  <view class="call-room">
    <view class="remote-area">
      <view v-for="item in playerList" :key="item.id" class="player-wrap">
        <live-player
          v-if="item.src"
          :id="item.id"
          class="player"
          :src="item.src"
          :mode="item.mode || 'RTC'"
          :autoplay="item.autoplay !== false"
          :mute-audio="item.muteAudio || false"
          :mute-video="item.muteVideo || false"
          :orientation="item.orientation || 'vertical'"
          :object-fit="item.objectFit || 'fillCrop'"
          :data-streamid="item.streamID"
          @statechange="playerStateChange"
          @netstatus="playerNetStatus"
          @audiovolumenotify="playerAudioVolumeNotify"
        />
      </view>
      <view v-if="!playerList.length" class="waiting">
        <text class="waiting-text">{{ statusText }}</text>
      </view>
    </view>

    <live-pusher
      v-if="pusher.url"
      class="pusher"
      :url="pusher.url"
      :mode="pusher.mode || 'RTC'"
      :enable-camera="pusher.enableCamera"
      :enable-mic="pusher.enableMic"
      :autopush="pusher.autopush || false"
      :muted="!pusher.enableMic"
      :enable-agc="pusher.enableAgc || false"
      :enable-ans="pusher.enableAns || false"
      :front-camera="pusher.frontCamera || 'front'"
      @statechange="pusherStateChange"
      @netstatus="pusherNetStatus"
      @error="pusherError"
      @audiovolumenotify="pusherAudioVolumeNotify"
    />

    <view class="bottom-bar">
      <view class="action-btn" @click="toggleMic">
        <text>{{ micOn ? '麦克风开' : '麦克风关' }}</text>
      </view>
      <view v-if="isVideo" class="action-btn" @click="toggleCamera">
        <text>{{ cameraOn ? '摄像头开' : '摄像头关' }}</text>
      </view>
      <view class="action-btn hangup" @click="hangup">
        <text>挂断</text>
      </view>
    </view>
  </view>
</template>

<script>
// #ifdef MP-WEIXIN
import TRTC from '@/utils/trtc/trtc-wx.js'
// #endif
import { getCallCredentials, acceptImCall, endImCall } from '@/api/im'

export default {
  data() {
    return {
      trtc: null,
      pusher: {},
      playerList: [],
      callId: null,
      role: 'caller',
      callType: '1',
      peerName: '通话',
      statusText: '正在连接...',
      micOn: true,
      cameraOn: true,
      joined: false,
      hanging: false
    }
  },
  computed: {
    isVideo() {
      return this.callType === '2'
    }
  },
  onLoad(options) {
    this.callId = Number(options.callId)
    this.role = options.role || 'caller'
    this.callType = options.callType || '1'
    this.peerName = decodeURIComponent(options.peerName || '通话')
    uni.setNavigationBarTitle({ title: this.peerName })
    // #ifdef MP-WEIXIN
    this.trtc = new TRTC(this)
    this.bindTrtcEvents()
    this.initCall()
    // #endif
    // #ifndef MP-WEIXIN
    uni.showToast({ title: '请在微信小程序真机使用通话', icon: 'none' })
    // #endif
  },
  onUnload() {
    this.leaveRoom(false)
  },
  methods: {
    bindTrtcEvents() {
      if (!this.trtc) return
      this.trtc.on(this.trtc.EVENT.REMOTE_USER_JOIN, () => {
        this.playerList = this.trtc.getPlayerList()
        this.statusText = '通话中'
      })
      this.trtc.on(this.trtc.EVENT.REMOTE_USER_LEAVE, () => {
        this.playerList = this.trtc.getPlayerList()
      })
      this.trtc.on(this.trtc.EVENT.REMOTE_VIDEO_ADD, () => {
        this.playerList = this.trtc.getPlayerList()
      })
      this.trtc.on(this.trtc.EVENT.REMOTE_AUDIO_ADD, () => {
        this.playerList = this.trtc.getPlayerList()
      })
      this.trtc.on(this.trtc.EVENT.ERROR, (err) => {
        console.error('TRTC error', err)
        this.statusText = '连接异常'
      })
      this.trtc.on(this.trtc.EVENT.LOCAL_JOIN, () => {
        this.joined = true
        this.statusText = '等待对方加入...'
      })
      this.trtc.on(this.trtc.EVENT.KICKED_OUT, () => {
        this.leaveRoom(false)
        uni.navigateBack()
      })
    },
    async initCall() {
      try {
        let trtcCred = null
        if (this.role === 'callee') {
          const acceptRes = await acceptImCall(this.callId)
          trtcCred = acceptRes.data || acceptRes
        } else {
          const credRes = await getCallCredentials(this.callId)
          trtcCred = credRes.data || credRes
        }
        if (!trtcCred || !trtcCred.enabled) {
          uni.showToast({ title: 'TRTC 未配置或凭证无效', icon: 'none' })
          setTimeout(() => uni.navigateBack(), 1500)
          return
        }
        this.enterTrtcRoom(trtcCred)
      } catch (e) {
        console.error(e)
        uni.showToast({ title: '进入通话失败', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 1500)
      }
    },
    enterTrtcRoom(cred) {
      const enableCamera = this.isVideo
      const enableMic = true
      this.micOn = enableMic
      this.cameraOn = enableCamera
      this.trtc.createPusher({
        enableCamera,
        enableMic
      })
      const pusherConfig = this.trtc.enterRoom({
        sdkAppID: Number(cred.sdkAppId),
        userID: cred.trtcUserId,
        userSig: cred.userSig,
        roomID: Number(cred.roomId),
        enableCamera,
        enableMic,
        scene: 'videocall'
      })
      this.pusher = pusherConfig
      this.$nextTick(() => {
        this.trtc.getPusherInstance().start({
          success: () => {
            this.statusText = '正在呼叫...'
          },
          fail: (err) => {
            console.error('start pusher fail', err)
            uni.showToast({ title: '推流启动失败', icon: 'none' })
          }
        })
      })
    },
    pusherStateChange(e) {
      if (this.trtc) this.trtc.pusherEventHandler(e)
    },
    pusherNetStatus(e) {
      if (this.trtc) this.trtc.pusherNetStatusHandler(e)
    },
    pusherError(e) {
      if (this.trtc) this.trtc.pusherErrorHandler(e)
    },
    pusherAudioVolumeNotify(e) {
      if (this.trtc) this.trtc.pusherAudioVolumeNotify(e)
    },
    playerStateChange(e) {
      if (this.trtc) this.trtc.playerEventHandler(e)
    },
    playerNetStatus(e) {
      if (this.trtc) this.trtc.playerNetStatus(e)
    },
    playerAudioVolumeNotify(e) {
      if (this.trtc) this.trtc.playerAudioVolumeNotify(e)
    },
    toggleMic() {
      this.micOn = !this.micOn
      if (this.trtc) {
        this.trtc.setPusherAttributes({ enableMic: this.micOn })
        this.pusher = this.trtc.getPusherAttributes()
      }
    },
    toggleCamera() {
      this.cameraOn = !this.cameraOn
      if (this.trtc) {
        this.trtc.setPusherAttributes({ enableCamera: this.cameraOn })
        this.pusher = this.trtc.getPusherAttributes()
      }
    },
    hangup() {
      this.leaveRoom(true)
      uni.navigateBack()
    },
    leaveRoom(notifyServer) {
      if (this.hanging) return
      this.hanging = true
      if (this.trtc) {
        const data = this.trtc.exitRoom()
        this.pusher = data.pusher || {}
        this.playerList = data.playerList || []
      }
      if (notifyServer && this.callId) {
        endImCall(this.callId).catch(() => {})
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.call-room {
  height: 100vh;
  background: #1a1a1a;
  position: relative;
  overflow: hidden;
}
.remote-area {
  width: 100%;
  height: 100%;
}
.player-wrap, .player {
  width: 100%;
  height: 100%;
}
.waiting {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.waiting-text {
  color: #fff;
  font-size: 32rpx;
}
.pusher {
  position: absolute;
  top: 40rpx;
  right: 24rpx;
  width: 220rpx;
  height: 320rpx;
  border-radius: 16rpx;
  overflow: hidden;
  z-index: 2;
}
.bottom-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 60rpx;
  display: flex;
  justify-content: center;
  gap: 40rpx;
  z-index: 3;
}
.action-btn {
  min-width: 160rpx;
  padding: 20rpx 28rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 26rpx;
  text-align: center;
}
.action-btn.hangup {
  background: #ff4d4f;
}
</style>
