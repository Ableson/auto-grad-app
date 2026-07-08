import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAreaList } from '@/api/area'

export const useAreaStore = defineStore('area', () => {
  const areaList = ref([])
  const loaded = ref(false)
  const loading = ref(false)
  const childrenMap = ref({})

  const provinces = computed(() => areaList.value.filter((item) => item.deep === 0))

  function buildIndex(list) {
    const map = {}
    for (const item of list) {
      const pid = item.pid || '0'
      if (!map[pid]) {
        map[pid] = []
      }
      map[pid].push(item)
    }
    childrenMap.value = map
  }

  function normalizeRegionName(name) {
    if (!name) return ''
    let result = String(name).trim()
    const suffixes = ['维吾尔自治区', '壮族自治区', '回族自治区', '自治区', '特别行政区', '自治州', '地区', '盟', '省', '市', '区', '县']
    for (const suffix of suffixes) {
      if (result.endsWith(suffix) && result.length > suffix.length) {
        result = result.slice(0, -suffix.length)
        break
      }
    }
    return result
  }

  function matchAreaName(area, name) {
    if (!area || !name) return false
    const target = normalizeRegionName(name)
    if (!target) return false
    return area.name === target
      || area.name === name
      || normalizeRegionName(area.extName) === target
      || area.extName === name
  }

  function getCitiesByProvinceId(provinceId, extraCityName) {
    const list = (childrenMap.value[provinceId] || []).filter((item) => item.deep === 1)
    if (!extraCityName) {
      return list
    }
    const exists = list.some((item) => matchAreaName(item, extraCityName))
    if (exists) {
      return list
    }
    return [{ id: `custom-${provinceId}`, pid: provinceId, deep: 1, name: extraCityName }, ...list]
  }

  function getDistrictsByCityId(cityId, extraDistrictName) {
    const list = (childrenMap.value[cityId] || []).filter((item) => item.deep === 2)
    if (!extraDistrictName) {
      return list
    }
    const exists = list.some((item) => matchAreaName(item, extraDistrictName))
    if (exists) {
      return list
    }
    return [{ id: `custom-${cityId}`, pid: cityId, deep: 2, name: extraDistrictName }, ...list]
  }

  function getAreaFullName(area) {
    if (!area) return ''
    return area.extName || area.name || ''
  }

  function findProvinceByName(name) {
    if (!name) return null
    return provinces.value.find((item) => matchAreaName(item, name)) || null
  }

  function findCityByName(provinceId, name) {
    if (!provinceId || !name) return null
    return getCitiesByProvinceId(provinceId).find((item) => matchAreaName(item, name)) || null
  }

  function findDistrictByName(cityId, name) {
    if (!cityId || !name) return null
    return getDistrictsByCityId(cityId).find((item) => matchAreaName(item, name)) || null
  }

  async function loadAreaOnce() {
    if (loaded.value || loading.value) {
      return
    }
    loading.value = true
    try {
      const res = await getAreaList()
      const list = res.data || res.rows || res || []
      areaList.value = Array.isArray(list) ? list : []
      buildIndex(areaList.value)
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function ensureLoaded() {
    if (loaded.value) {
      return
    }
    await loadAreaOnce()
  }

  function clearArea() {
    areaList.value = []
    childrenMap.value = {}
    loaded.value = false
    loading.value = false
  }

  return {
    areaList,
    loaded,
    loading,
    provinces,
    loadAreaOnce,
    ensureLoaded,
    clearArea,
    getCitiesByProvinceId,
    getDistrictsByCityId,
    findProvinceByName,
    findCityByName,
    findDistrictByName,
    getAreaFullName,
    normalizeRegionName
  }
})
