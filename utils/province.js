/** 省份简称列表（与后端 province_name 保持一致） */
export const PROVINCE_LIST = [
  '北京', '天津', '上海', '重庆',
  '河北', '山西', '辽宁', '吉林', '黑龙江',
  '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '海南',
  '四川', '贵州', '云南', '陕西', '甘肃', '青海',
  '内蒙古', '广西', '西藏', '宁夏', '新疆', '香港', '澳门', '台湾'
]

/** 各省大致中心坐标，用于地图默认视野 */
export const PROVINCE_CENTERS = {
  '北京': { latitude: 39.9042, longitude: 116.4074 },
  '天津': { latitude: 39.3434, longitude: 117.3616 },
  '上海': { latitude: 31.2304, longitude: 121.4737 },
  '重庆': { latitude: 29.5630, longitude: 106.5516 },
  '河北': { latitude: 38.0428, longitude: 114.5149 },
  '山西': { latitude: 37.8706, longitude: 112.5489 },
  '辽宁': { latitude: 41.8057, longitude: 123.4315 },
  '吉林': { latitude: 43.8868, longitude: 125.3245 },
  '黑龙江': { latitude: 45.8038, longitude: 126.5349 },
  '江苏': { latitude: 32.0603, longitude: 118.7969 },
  '浙江': { latitude: 30.2741, longitude: 120.1551 },
  '安徽': { latitude: 31.8206, longitude: 117.2272 },
  '福建': { latitude: 26.0745, longitude: 119.2965 },
  '江西': { latitude: 28.6820, longitude: 115.8579 },
  '山东': { latitude: 36.6512, longitude: 117.1201 },
  '河南': { latitude: 34.7466, longitude: 113.6254 },
  '湖北': { latitude: 30.5928, longitude: 114.3055 },
  '湖南': { latitude: 28.2282, longitude: 112.9388 },
  '广东': { latitude: 23.1291, longitude: 113.2644 },
  '海南': { latitude: 20.0440, longitude: 110.1999 },
  '四川': { latitude: 30.5728, longitude: 104.0668 },
  '贵州': { latitude: 26.6470, longitude: 106.6302 },
  '云南': { latitude: 25.0453, longitude: 102.7097 },
  '陕西': { latitude: 34.3416, longitude: 108.9398 },
  '甘肃': { latitude: 36.0611, longitude: 103.8343 },
  '青海': { latitude: 36.6232, longitude: 101.7805 },
  '内蒙古': { latitude: 40.8426, longitude: 111.7492 },
  '广西': { latitude: 22.8170, longitude: 108.3669 },
  '西藏': { latitude: 29.6520, longitude: 91.1721 },
  '宁夏': { latitude: 38.4872, longitude: 106.2309 },
  '新疆': { latitude: 43.8256, longitude: 87.6168 },
  '香港': { latitude: 22.3193, longitude: 114.1694 },
  '澳门': { latitude: 22.1987, longitude: 113.5439 },
  '台湾': { latitude: 25.0330, longitude: 121.5654 }
}

/** 将逆地理编码返回的省名转为库内 provinceName 格式 */
export function normalizeProvinceName(name) {
  if (!name) return ''
  const suffixes = ['维吾尔自治区', '壮族自治区', '回族自治区', '自治区', '特别行政区', '省', '市']
  let result = name.trim()
  for (const suffix of suffixes) {
    if (result.endsWith(suffix)) {
      result = result.slice(0, -suffix.length)
      break
    }
  }
  return result
}

export function getProvinceCenter(provinceName) {
  return PROVINCE_CENTERS[provinceName] || PROVINCE_CENTERS['江苏']
}
