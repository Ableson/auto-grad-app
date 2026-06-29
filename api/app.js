import request from '@/utils/request'

/** 拉取小程序运行时配置（文件 URL 前缀、地图半径选项等） */
export function getAppConfig() {
  return request({
    url: '/house/app/config',
    method: 'get',
    headers: {
      isToken: false
    }
  })
}
