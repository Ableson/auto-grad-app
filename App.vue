<script setup>
  import config from './config'
  import { getToken } from '@/utils/auth'
  import { useConfigStore, useAreaStore, useUserStore } from '@/store'
  import { getCurrentInstance } from "vue"
  import { onLaunch } from '@dcloudio/uni-app'

  const { proxy } = getCurrentInstance()

  onLaunch(() => {
    initApp()
  })

  // 初始化应用
  function initApp() {
    initConfig()
    if (getToken()) {
      useAreaStore().loadAreaOnce().catch(() => {})
      useUserStore().refreshAgencyStatus().catch(() => {})
    }
  }

  function initConfig() {
    useConfigStore().setConfig(config)
    useConfigStore().loadServerConfig().catch(() => {})
  }
</script>

<style lang="scss">
  @import '@/static/scss/index.scss'
</style>
