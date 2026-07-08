export const FILTER_TABS = [
  { key: 'region', label: '区域' },
  { key: 'price', label: '起拍价' },
  { key: 'area', label: '面积' },
  { key: 'more', label: '更多' },
  { key: 'sort', label: '排序' }
]

export const PRICE_PRESETS = [
  { label: '300万以下', min: '', max: 300 },
  { label: '300-500万', min: 300, max: 500 },
  { label: '500-800万', min: 500, max: 800 },
  { label: '800-1200万', min: 800, max: 1200 },
  { label: '1200-2000万', min: 1200, max: 2000 },
  { label: '2000万以上', min: 2000, max: '' }
]

export const AREA_PRESETS = [
  { label: '50m²以下', min: '', max: 50 },
  { label: '50-70m²', min: 50, max: 70 },
  { label: '70-90m²', min: 70, max: 90 },
  { label: '90-110m²', min: 90, max: 110 },
  { label: '110-140m²', min: 110, max: 140 },
  { label: '140m²以上', min: 140, max: '' }
]

export const ITEM_TYPE_OPTIONS = ['其它', '住宅', '公寓', '商业', '写字楼', '车位', '国有资产']

export const ROOM_TYPE_OPTIONS = ['一室', '二室', '三室', '四室', '五室以上']

/** 拍卖状态：已结束由 start_time 动态判断，一拍/二拍/变卖来自详情表 */
export const AUCTION_STATUS_OPTIONS = [
  { label: '已结束', value: 'ended' },
  { label: '一拍', value: 1 },
  { label: '二拍', value: 2 },
  { label: '变卖', value: 3 }
]

export const SORT_OPTIONS = [
  { label: '默认排序', value: 'default' },
  { label: '最新发布', value: 'saved_at_desc' },
  { label: '开拍时间由近及远', value: 'start_time_asc' },
  { label: '开拍时间由远及近', value: 'start_time_desc' },
  { label: '总价从低到高', value: 'start_price_asc' },
  { label: '总价从高到低', value: 'start_price_desc' },
  { label: '单价从低到高', value: 'unit_price_asc' },
  { label: '单价从高到低', value: 'unit_price_desc' },
  { label: '面积从小到大', value: 'building_area_asc' },
  { label: '面积从大到小', value: 'building_area_desc' }
]

export function createDefaultFilters() {
  return {
    provinceName: '',
    cityName: '',
    districtName: '',
    minStartPrice: '',
    maxStartPrice: '',
    minBuildingArea: '',
    maxBuildingArea: '',
    itemType: '',
    houseLayoutRoom: '',
    auctionPhase: '',
    orderBy: 'default'
  }
}

export function cloneFilters(filters = {}) {
  return { ...createDefaultFilters(), ...filters }
}

export function parseNumber(value) {
  const text = String(value ?? '').trim()
  if (!text) return undefined
  const num = Number(text)
  return Number.isFinite(num) && num >= 0 ? num : undefined
}

function buildAuctionPhaseParams(auctionPhase) {
  if (auctionPhase === 'ended') {
    return { auctionTimeStatus: 'ended' }
  }
  if (auctionPhase === '' || auctionPhase === null || auctionPhase === undefined) {
    // 首页默认：不展示已结束，但不显示「待拍」筛选项
    return { auctionTimeStatus: 'pending' }
  }
  return { auctionStatus: auctionPhase }
}

export function buildAuctionListParams(filters = {}, baseQuery = {}) {
  const orderBy = filters.orderBy && filters.orderBy !== 'default' ? filters.orderBy : undefined
  return {
    ...baseQuery,
    provinceName: filters.provinceName || undefined,
    cityName: filters.cityName || undefined,
    districtName: filters.districtName || undefined,
    searchValue: baseQuery.searchValue || undefined,
    minStartPrice: parseNumber(filters.minStartPrice),
    maxStartPrice: parseNumber(filters.maxStartPrice),
    minBuildingArea: parseNumber(filters.minBuildingArea),
    maxBuildingArea: parseNumber(filters.maxBuildingArea),
    itemType: filters.itemType || undefined,
    houseLayoutKeyword: filters.houseLayoutRoom || undefined,
    ...buildAuctionPhaseParams(filters.auctionPhase),
    orderBy
  }
}

export function getFilterTabLabel(tabKey, filters = {}) {
  if (tabKey === 'region') {
    return filters.districtName || filters.cityName || filters.provinceName || '区域'
  }
  if (tabKey === 'price') {
    const min = String(filters.minStartPrice || '').trim()
    const max = String(filters.maxStartPrice || '').trim()
    if (min || max) return `${min || '0'}-${max || '∞'}万`
    return '起拍价'
  }
  if (tabKey === 'area') {
    const min = String(filters.minBuildingArea || '').trim()
    const max = String(filters.maxBuildingArea || '').trim()
    if (min || max) return `${min || '0'}-${max || '∞'}m²`
    return '面积'
  }
  if (tabKey === 'more') {
    const parts = []
    if (filters.itemType) parts.push(filters.itemType)
    if (filters.houseLayoutRoom) parts.push(filters.houseLayoutRoom)
    if (filters.auctionPhase) {
      const status = AUCTION_STATUS_OPTIONS.find(item => item.value === filters.auctionPhase)
      if (status) parts.push(status.label)
    }
    return parts.length ? parts.join('·') : '更多'
  }
  if (tabKey === 'sort') {
    const option = SORT_OPTIONS.find(item => item.value === filters.orderBy)
    return option?.label || '排序'
  }
  return ''
}

export function isFilterTabActive(tabKey, filters = {}) {
  if (tabKey === 'region') {
    return !!(filters.provinceName || filters.cityName || filters.districtName)
  }
  if (tabKey === 'price') {
    return !!(filters.minStartPrice || filters.maxStartPrice)
  }
  if (tabKey === 'area') {
    return !!(filters.minBuildingArea || filters.maxBuildingArea)
  }
  if (tabKey === 'more') {
    return !!(filters.itemType || filters.houseLayoutRoom || filters.auctionPhase)
  }
  if (tabKey === 'sort') {
    return filters.orderBy && filters.orderBy !== 'default'
  }
  return false
}
