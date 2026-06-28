/** 地图服务商：tencent 腾讯 | amap 高德 | baidu 百度 */
import appConfig from '@/config'

export const MAP_PROVIDERS = {
  tencent: { label: '腾讯地图', native: 'qq' },
  amap: { label: '高德地图', native: 'amap' },
  baidu: { label: '百度地图', native: 'baidu' }
}

export const DEFAULT_MAP_PROVIDER = 'tencent'

/**
 * 读取 config.js 中的地图配置
 * map: { provider: 'tencent', keys: { tencent: '', amap: '', baidu: '' } }
 */
export function getMapConfig() {
  const map = appConfig.map || {}
  const provider = map.provider || DEFAULT_MAP_PROVIDER
  const keys = {
    tencent: map.keys?.tencent || '',
    amap: map.keys?.amap || '',
    baidu: map.keys?.baidu || ''
  }
  return {
    provider: MAP_PROVIDERS[provider] ? provider : DEFAULT_MAP_PROVIDER,
    keys
  }
}

export function getMapProvider() {
  return getMapConfig().provider
}

export function getMapProviderLabel() {
  const provider = getMapProvider()
  return MAP_PROVIDERS[provider]?.label || '腾讯地图'
}

/** App 端 map 组件 provider 属性；微信小程序底层为腾讯原生地图 */
export function getNativeMapProvider() {
  const provider = getMapProvider()
  return MAP_PROVIDERS[provider]?.native || 'qq'
}

export function getMapApiKey(provider) {
  const current = provider || getMapProvider()
  const { keys } = getMapConfig()
  return keys[current] || ''
}

/** uni.getLocation 坐标类型 */
export function getLocationType() {
  return 'gcj02'
}
