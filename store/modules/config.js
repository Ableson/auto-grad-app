import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAppConfig } from '@/api/app'

export const useConfigStore = defineStore('config', () => {
  const config = ref()
  const serverConfig = ref(null)
  let loadingPromise = null

  const setConfig = (val) => {
    config.value = val
  }

  const applyServerConfig = (payload) => {
    if (!payload) return null
    serverConfig.value = payload
    return payload
  }

  /** 从后端拉取运行时配置，失败时保留已有缓存 */
  const loadServerConfig = (force = false) => {
    if (serverConfig.value && !force) {
      return Promise.resolve(serverConfig.value)
    }
    if (loadingPromise && !force) {
      return loadingPromise
    }
    loadingPromise = getAppConfig()
      .then((res) => applyServerConfig(res.data || res))
      .catch((err) => {
        console.warn('加载服务端配置失败', err)
        return serverConfig.value
      })
      .finally(() => {
        loadingPromise = null
      })
    return loadingPromise
  }

  return {
    config,
    serverConfig,
    setConfig,
    loadServerConfig
  }
})
