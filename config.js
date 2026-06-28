// 应用全局配置
export default {
  // 生产环境：nginx 将 /prod-api 反向代理到后端（见 ruoyi-ui-house/nginx.conf）
  // baseUrl: 'http://localhost:8080/prod-api',
  baseUrl: 'http://localhost:8080',
  // 本地直连 Spring Boot（无 nginx）时改为：'http://localhost:8080'

  /**
   * 地图服务配置（切换 provider 即可适配不同地图平台）
   * provider: tencent | amap | baidu
   * 微信小程序 request 合法域名需配置对应 API 域名：
   *   腾讯 apis.map.qq.com | 高德 restapi.amap.com | 百度 api.map.baidu.com
   * 逆地理编码失败时会依次尝试已配置 Key 的服务；建议微信小程序至少配置 tencent Key 作为兜底
   */
  map: {
    provider: 'tencent',
    keys: {
      tencent: 'SGSBZ-GCA64-KV5U3-KYK2O-CFUG6-3UBTQ',
      amap: '',
      baidu: 'eDwcbdnneleXEmLHrgH45ArCzcsPD0C6'
    }
  },

  // 应用信息
  appInfo: {
    // 应用名称
    name: "house-app",
    // 应用版本
    version: "1.2.0",
    // 应用logo
    logo: "/static/logo.png",
    // 官方网站
    site_url: "http://ruoyi.vip",
    // 政策协议
    agreements: [{
        title: "隐私政策",
        url: "https://ruoyi.vip/protocol.html"
      },
      {
        title: "用户服务协议",
        url: "https://ruoyi.vip/protocol.html"
      }
    ]
  }
}
