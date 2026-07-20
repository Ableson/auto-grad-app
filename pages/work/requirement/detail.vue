<template>
  <view class="detail-page">
    <view v-if="loading" class="empty-tip">加载中...</view>
    <template v-else-if="detail || isCreateMode">
      <view class="user-bar">
        <image
          v-if="!isManualMode && !isCreateMode"
          :src="resolveAvatar(detail.avatar)"
          class="avatar"
          mode="aspectFill"
          @click="goProfile"
        />
        <view v-else class="avatar avatar-manual">
          <text class="avatar-text">{{ manualAvatarText }}</text>
        </view>
        <view class="user-info">
          <text class="name">{{ displayName }}</text>
          <text class="sub">{{ subTitle }}</text>
        </view>
        <view v-if="!isCreateMode" class="match-entry" @click="openMatchHouses">
          <text class="match-num">{{ detail.matchHouseCount || 0 }}</text>
          <text class="match-label">匹配房源</text>
        </view>
      </view>

      <view class="form-card">
        <view v-if="isManualMode || isCreateMode" class="form-item">
          <text class="form-label">客户名称</text>
          <input v-model="form.customerName" class="form-input" placeholder="请输入客户名称" />
        </view>
        <view v-if="isManualMode || isCreateMode" class="form-item">
          <text class="form-label">客户电话</text>
          <input v-model="form.customerPhone" class="form-input" type="number" placeholder="选填" />
        </view>
        <view
          class="form-item region-row-item"
          :class="{
            'region-province-active': provinceDropdownOpen,
            'region-city-active': cityDropdownOpen,
            'region-district-active': districtDropdownOpen
          }"
        >
          <text class="form-label">关注区域</text>
          <view class="region-row">
            <view class="region-col picker-item" :class="{ active: provinceDropdownOpen }" :style="provincePickerStyle">
              <view class="picker-wrap">
                <view v-if="provinceDropdownOpen" class="picker-mask" @click="closeProvinceDropdown"></view>
                <view class="picker-trigger region-trigger" @click.stop="toggleProvinceDropdown">
                  <text :class="['picker-value region-value', { placeholder: !form.provinceName }]">
                    {{ form.provinceName || '省份' }}
                  </text>
                  <text class="picker-arrow" :class="{ open: provinceDropdownOpen }">▼</text>
                </view>
                <scroll-view v-if="provinceDropdownOpen" scroll-y class="picker-dropdown region-dropdown" @click.stop>
                  <view
                    v-for="item in provinceOptions"
                    :key="item.id"
                    class="picker-option"
                    :class="{ active: item.id === selectedProvinceId }"
                    @click="selectProvince(item)"
                  >
                    <text>{{ areaFullName(item) }}</text>
                    <text v-if="item.id === selectedProvinceId" class="picker-check">✓</text>
                  </view>
                </scroll-view>
              </view>
            </view>

            <view class="region-col picker-item" :class="{ active: cityDropdownOpen }" :style="cityPickerStyle">
              <view class="picker-wrap">
                <view v-if="cityDropdownOpen" class="picker-mask" @click="closeCityDropdown"></view>
                <view
                  class="picker-trigger region-trigger"
                  :class="{ disabled: !form.provinceName }"
                  @click.stop="toggleCityDropdown"
                >
                  <text :class="['picker-value region-value', { placeholder: !form.cityName }]">
                    {{ form.cityName || '城市' }}
                  </text>
                  <text class="picker-arrow" :class="{ open: cityDropdownOpen }">▼</text>
                </view>
                <scroll-view v-if="cityDropdownOpen" scroll-y class="picker-dropdown region-dropdown" @click.stop>
                  <view
                    v-for="item in cityOptions"
                    :key="item.id"
                    class="picker-option"
                    :class="{ active: isSameArea(item, form.cityName) }"
                    @click="selectCity(item)"
                  >
                    <text>{{ areaFullName(item) }}</text>
                    <text v-if="isSameArea(item, form.cityName)" class="picker-check">✓</text>
                  </view>
                </scroll-view>
              </view>
            </view>

            <view class="region-col picker-item" :class="{ active: districtDropdownOpen }" :style="districtPickerStyle">
              <view class="picker-wrap">
                <view v-if="districtDropdownOpen" class="picker-mask" @click="closeDistrictDropdown"></view>
                <view
                  class="picker-trigger region-trigger"
                  :class="{ disabled: !form.cityName }"
                  @click.stop="toggleDistrictDropdown"
                >
                  <text :class="['picker-value region-value', { placeholder: !form.districtName }]">
                    {{ form.districtName || '区县' }}
                  </text>
                  <text class="picker-arrow" :class="{ open: districtDropdownOpen }">▼</text>
                </view>
                <scroll-view v-if="districtDropdownOpen" scroll-y class="picker-dropdown region-dropdown" @click.stop>
                  <view
                    v-for="item in districtOptions"
                    :key="item.id"
                    class="picker-option"
                    :class="{ active: isSameArea(item, form.districtName) }"
                    @click="selectDistrict(item)"
                  >
                    <text>{{ areaFullName(item) }}</text>
                    <text v-if="isSameArea(item, form.districtName)" class="picker-check">✓</text>
                  </view>
                </scroll-view>
              </view>
            </view>
          </view>
        </view>

        <view class="form-divider">
          <view class="divider-line"></view>
          <text class="divider-text">或</text>
          <view class="divider-line"></view>
        </view>

        <view class="form-item map-scope-item">
          <text class="form-label">地图范围选择</text>
          <text class="form-hint">与省市区二选一</text>
          <view class="map-scope-card" @click="openMapPicker">
            <view v-if="hasMapScope" class="map-scope-content">
              <text class="map-scope-title">已选中心点 · 周边 {{ form.mapRadiusKm || defaultMapRadiusKm }}km</text>
              <text class="map-scope-sub">{{ form.mapAddress || mapScopeLabel }}</text>
            </view>
            <text v-else class="map-scope-placeholder">点击打开地图选择关注位置</text>
            <text class="map-scope-arrow">›</text>
          </view>
          <text v-if="hasMapScope" class="clear-map-btn" @click.stop="clearMapScope">清除地图范围</text>
        </view>

        <view class="form-item">
          <text class="form-label">最低起拍价(元)</text>
          <input v-model="form.minStartPriceYuan" class="form-input" type="number" placeholder="选填" />
        </view>
        <view class="form-item">
          <text class="form-label">最高起拍价(元)</text>
          <input v-model="form.maxStartPriceYuan" class="form-input" type="number" placeholder="选填" />
        </view>
        <view class="form-item">
          <text class="form-label">最低保证金(元)</text>
          <input v-model="form.minDepositYuan" class="form-input" type="number" placeholder="选填" />
        </view>
        <view class="form-item">
          <text class="form-label">最高保证金(元)</text>
          <input v-model="form.maxDepositYuan" class="form-input" type="number" placeholder="选填" />
        </view>
        <view class="form-item">
          <text class="form-label">标的物类型</text>
          <picker :range="itemTypeOptions" @change="onItemTypeChange">
            <view class="picker-field">{{ form.itemType || '请选择（选填）' }}</view>
          </picker>
        </view>
      </view>

      <view class="action-bar">
        <button class="save-btn" :loading="saving" @click="handleSave">{{ isCreateMode ? '保存并录入' : '保存需求' }}</button>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getToken } from '@/utils/auth'
import { getAgencyRequirementDetail, updateAgencyRequirement, getAgencyManualRequirement, createAgencyManualRequirement, updateAgencyManualRequirement } from '@/api/agency'
import { useAreaStore, useConfigStore } from '@/store'
import config from '@/config'
import defAva from '@/static/images/profile.jpg'

const baseUrl = config.baseUrl
const itemTypeOptions = ['住宅', '商业', '车辆', '土地', '股权', '其他']
const areaStore = useAreaStore()
const configStore = useConfigStore()
const defaultMapRadiusKm = ref(50)

const userId = ref(null)
const requirementId = ref(null)
const pageMode = ref('')
const detail = ref(null)
const loading = ref(false)
const saving = ref(false)
const selectedProvinceId = ref('')
const selectedCityId = ref('')
const provinceDropdownOpen = ref(false)
const cityDropdownOpen = ref(false)
const districtDropdownOpen = ref(false)

const form = ref({
  customerName: '',
  customerPhone: '',
  provinceName: '',
  cityName: '',
  districtName: '',
  locationType: '1',
  mapLatitude: null,
  mapLongitude: null,
  mapRadiusKm: null,
  mapAddress: '',
  minStartPriceYuan: '',
  maxStartPriceYuan: '',
  minDepositYuan: '',
  maxDepositYuan: '',
  itemType: ''
})

const provinceOptions = computed(() => areaStore.provinces)
const cityOptions = computed(() => {
  if (!selectedProvinceId.value) return []
  return areaStore.getCitiesByProvinceId(selectedProvinceId.value, form.value.cityName)
})
const districtOptions = computed(() => {
  if (!selectedCityId.value) return []
  return areaStore.getDistrictsByCityId(selectedCityId.value, form.value.districtName)
})

const provincePickerStyle = computed(() => (
  provinceDropdownOpen.value ? { zIndex: 44 } : undefined
))
const cityPickerStyle = computed(() => (
  cityDropdownOpen.value ? { zIndex: 43 } : undefined
))
const districtPickerStyle = computed(() => (
  districtDropdownOpen.value ? { zIndex: 42 } : undefined
))

const isCreateMode = computed(() => pageMode.value === 'create')
const isManualMode = computed(() => pageMode.value === 'manual' || detail.value?.sourceType === '2')
const hasMapScope = computed(() => form.value.locationType === '2' && form.value.mapLatitude != null && form.value.mapLongitude != null)
const mapScopeLabel = computed(() => {
  if (!hasMapScope.value) return ''
  const lat = Number(form.value.mapLatitude).toFixed(4)
  const lng = Number(form.value.mapLongitude).toFixed(4)
  return `${lat}, ${lng}`
})

const displayName = computed(() => {
  if (isCreateMode.value) return '新建客户需求'
  if (isManualMode.value) return detail.value?.customerName || form.value.customerName || '线下客户'
  if (!detail.value) return '用户'
  if (detail.value.nickName) return detail.value.nickName
  return `用户${detail.value.customerUserId}`
})

const subTitle = computed(() => {
  if (isCreateMode.value) return '录入线下客户，系统将按需求推荐房源'
  if (isManualMode.value) return detail.value?.customerPhone ? `电话：${detail.value.customerPhone}` : '手动录入客户'
  return `用户ID：${detail.value?.customerUserId || '-'}`
})

const manualAvatarText = computed(() => {
  const name = displayName.value || '客'
  return name.slice(0, 1)
})
onLoad(async (options) => {
  if (!getToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  userId.value = options.userId || null
  requirementId.value = options.id || null
  pageMode.value = options.mode || (requirementId.value ? 'manual' : '')
  uni.setNavigationBarTitle({
    title: pageMode.value === 'create' ? '录入客户需求' : '需求详情'
  })
  await areaStore.ensureLoaded()
  await loadMapRuntimeConfig()
  if (pageMode.value === 'create') {
    detail.value = { sourceType: '2' }
    return
  }
  loadDetail()
})

function firstCsv(value) {
  if (!value) return ''
  return String(value)
    .replace(/，/g, ',')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)[0] || ''
}

function areaFullName(area) {
  return areaStore.getAreaFullName(area)
}

function isSameArea(area, name) {
  if (!area || !name) return false
  return areaStore.getAreaFullName(area) === name || area.name === name
}

function clearRegionSelection() {
  selectedProvinceId.value = ''
  selectedCityId.value = ''
  form.value.provinceName = ''
  form.value.cityName = ''
  form.value.districtName = ''
}

function clearMapScope() {
  form.value.locationType = '1'
  form.value.mapLatitude = null
  form.value.mapLongitude = null
  form.value.mapRadiusKm = null
  form.value.mapAddress = ''
}

async function loadMapRuntimeConfig() {
  const cfg = await configStore.loadServerConfig()
  if (cfg?.defaultNearbyRadiusKm > 0) {
    defaultMapRadiusKm.value = cfg.defaultNearbyRadiusKm
  }
}

function applyMapLocation(data) {
  if (!data?.latitude || !data?.longitude) return
  form.value.locationType = '2'
  form.value.mapLatitude = Number(data.latitude)
  form.value.mapLongitude = Number(data.longitude)
  form.value.mapRadiusKm = Number(data.radiusKm || defaultMapRadiusKm.value)
  form.value.mapAddress = data.mapAddress || ''
  clearRegionSelection()
  closeProvinceDropdown()
  closeCityDropdown()
  closeDistrictDropdown()
}

function openMapPicker() {
  provinceDropdownOpen.value = false
  cityDropdownOpen.value = false
  districtDropdownOpen.value = false
  uni.navigateTo({
    url: '/pages/work/requirement/map-picker',
    events: {
      pickLocation: (data) => applyMapLocation(data)
    },
    success(res) {
      const radiusKm = form.value.mapRadiusKm || defaultMapRadiusKm.value
      const payload = hasMapScope.value
        ? {
            latitude: form.value.mapLatitude,
            longitude: form.value.mapLongitude,
            radiusKm
          }
        : { radiusKm }
      res.eventChannel.emit('init', payload)
    }
  })
}

function applyRegionData(provinceNames, cityNames, districtNames) {
  const provinceName = firstCsv(provinceNames)
  const cityName = firstCsv(cityNames)
  const districtName = firstCsv(districtNames)
  const province = provinceName ? areaStore.findProvinceByName(provinceName) : null
  selectedProvinceId.value = province?.id || ''
  form.value.provinceName = province ? areaStore.getAreaFullName(province) : provinceName
  selectedCityId.value = ''
  if (province && cityName) {
    const city = areaStore.findCityByName(province.id, cityName)
    selectedCityId.value = city?.id || ''
    form.value.cityName = city ? areaStore.getAreaFullName(city) : cityName
    if (city && districtName) {
      const district = areaStore.findDistrictByName(city.id, districtName)
      form.value.districtName = district ? areaStore.getAreaFullName(district) : districtName
    } else {
      form.value.districtName = districtName
    }
  } else {
    form.value.cityName = cityName
    form.value.districtName = districtName
  }
}

function toggleProvinceDropdown() {
  cityDropdownOpen.value = false
  districtDropdownOpen.value = false
  provinceDropdownOpen.value = !provinceDropdownOpen.value
}

function closeProvinceDropdown() {
  provinceDropdownOpen.value = false
}

function toggleCityDropdown() {
  if (!form.value.provinceName) {
    uni.showToast({ title: '请先选择省份', icon: 'none' })
    return
  }
  provinceDropdownOpen.value = false
  districtDropdownOpen.value = false
  cityDropdownOpen.value = !cityDropdownOpen.value
}

function closeCityDropdown() {
  cityDropdownOpen.value = false
}

function toggleDistrictDropdown() {
  if (!form.value.cityName) {
    uni.showToast({ title: '请先选择城市', icon: 'none' })
    return
  }
  if (!selectedCityId.value) {
    const province = areaStore.findProvinceByName(form.value.provinceName)
    const city = province ? areaStore.findCityByName(province.id, form.value.cityName) : null
    selectedCityId.value = city?.id || ''
  }
  if (!selectedCityId.value) {
    uni.showToast({ title: '当前城市暂无区县数据', icon: 'none' })
    return
  }
  provinceDropdownOpen.value = false
  cityDropdownOpen.value = false
  districtDropdownOpen.value = !districtDropdownOpen.value
}

function closeDistrictDropdown() {
  districtDropdownOpen.value = false
}

function selectProvince(province) {
  clearMapScope()
  if (selectedProvinceId.value !== province.id) {
    selectedProvinceId.value = province.id
    form.value.provinceName = areaStore.getAreaFullName(province)
    selectedCityId.value = ''
    form.value.cityName = ''
    form.value.districtName = ''
  }
  closeProvinceDropdown()
}

function selectCity(city) {
  clearMapScope()
  selectedCityId.value = city.id
  form.value.cityName = areaStore.getAreaFullName(city)
  form.value.districtName = ''
  closeCityDropdown()
}

function selectDistrict(district) {
  clearMapScope()
  form.value.districtName = areaStore.getAreaFullName(district)
  closeDistrictDropdown()
}

function resolveAvatar(avatar) {
  if (!avatar) return defAva
  if (/^https?:\/\//.test(avatar)) return avatar
  return baseUrl + avatar
}

function goProfile() {
  if (!userId.value) return
  uni.navigateTo({ url: `/pages/work/customer/profile?userId=${userId.value}` })
}

function openMatchHouses() {
  const name = encodeURIComponent(displayName.value)
  if (isManualMode.value && requirementId.value) {
    uni.navigateTo({
      url: `/pages/work/customer/houses?requirementId=${requirementId.value}&nickName=${name}&source=requirement`
    })
    return
  }
  uni.navigateTo({
    url: `/pages/work/customer/houses?userId=${userId.value}&nickName=${name}&source=requirement`
  })
}

function onItemTypeChange(e) {
  const idx = Number(e.detail.value)
  form.value.itemType = itemTypeOptions[idx] || ''
}

function toNumber(value) {
  if (value === '' || value == null) return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

async function loadDetail() {
  loading.value = true
  try {
    const res = isManualMode.value && requirementId.value
      ? await getAgencyManualRequirement(requirementId.value)
      : await getAgencyRequirementDetail(userId.value)
    const data = res.data || res
    detail.value = data
    if (isManualMode.value) {
      form.value.customerName = data.customerName || ''
      form.value.customerPhone = data.customerPhone || ''
    }
    if (data.locationType === '2' && data.mapLatitude != null && data.mapLongitude != null) {
      form.value.locationType = '2'
      form.value.mapLatitude = Number(data.mapLatitude)
      form.value.mapLongitude = Number(data.mapLongitude)
      form.value.mapRadiusKm = data.mapRadiusKm != null ? Number(data.mapRadiusKm) : defaultMapRadiusKm.value
      form.value.mapAddress = data.mapAddress || ''
    } else {
      applyRegionData(data.provinceNames, data.cityNames, data.districtNames)
      form.value.locationType = '1'
    }
    form.value.minStartPriceYuan = data.minStartPriceYuan != null ? String(data.minStartPriceYuan) : ''
    form.value.maxStartPriceYuan = data.maxStartPriceYuan != null ? String(data.maxStartPriceYuan) : ''
    form.value.minDepositYuan = data.minDepositYuan != null ? String(data.minDepositYuan) : ''
    form.value.maxDepositYuan = data.maxDepositYuan != null ? String(data.maxDepositYuan) : ''
    form.value.itemType = data.itemType || ''
  } catch (err) {
    uni.showToast({ title: err.msg || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function buildPayload() {
  const isMap = form.value.locationType === '2' && form.value.mapLatitude != null && form.value.mapLongitude != null
  return {
    customerName: form.value.customerName || null,
    customerPhone: form.value.customerPhone || null,
    locationType: isMap ? '2' : '1',
    provinceNames: isMap ? null : (form.value.provinceName || null),
    cityNames: isMap ? null : (form.value.cityName || null),
    districtNames: isMap ? null : (form.value.districtName || null),
    mapLatitude: isMap ? form.value.mapLatitude : null,
    mapLongitude: isMap ? form.value.mapLongitude : null,
    mapRadiusKm: isMap ? (form.value.mapRadiusKm || defaultMapRadiusKm.value) : null,
    mapAddress: isMap ? (form.value.mapAddress || null) : null,
    minStartPriceYuan: toNumber(form.value.minStartPriceYuan),
    maxStartPriceYuan: toNumber(form.value.maxStartPriceYuan),
    minDepositYuan: toNumber(form.value.minDepositYuan),
    maxDepositYuan: toNumber(form.value.maxDepositYuan),
    itemType: form.value.itemType || null
  }
}

async function handleSave() {
  if (saving.value) return
  if ((isCreateMode.value || isManualMode.value) && !form.value.customerName?.trim()) {
    uni.showToast({ title: '请填写客户名称', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    if (isCreateMode.value) {
      const res = await createAgencyManualRequirement(payload)
      const data = res.data || res
      uni.showToast({ title: '录入成功', icon: 'success' })
      setTimeout(() => {
        uni.redirectTo({
          url: `/pages/work/requirement/detail?id=${data.id}&mode=manual`
        })
      }, 800)
      return
    }
    if (isManualMode.value && requirementId.value) {
      await updateAgencyManualRequirement(requirementId.value, payload)
    } else {
      await updateAgencyRequirement(userId.value, payload)
    }
    uni.showToast({ title: '已保存', icon: 'success' })
    await loadDetail()
  } catch (err) {
    uni.showToast({ title: err.msg || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #f4f4f4;
  padding-bottom: 160rpx;
}

.user-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #fff;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.avatar-manual {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef4ff;
}

.avatar-text {
  font-size: 34rpx;
  font-weight: 600;
  color: #2979ff;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
}

.match-entry {
  width: 140rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8faff;
  border-radius: 12rpx;
  padding: 16rpx 8rpx;
}

.match-num {
  font-size: 36rpx;
  font-weight: 700;
  color: #2979ff;
}

.match-label {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #666;
}

.form-card {
  background: #fff;
  margin: 0 24rpx;
  border-radius: 16rpx;
  padding: 8rpx 24rpx 24rpx;
}

.form-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item.picker-item {
  position: relative;
  z-index: 1;
}

.form-item.picker-item.active {
  z-index: 40;
}

.region-row-item {
  position: relative;
  z-index: 1;
}

.region-row {
  display: flex;
  gap: 12rpx;
}

.region-col {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.region-row-item.region-province-active .region-col:first-child,
.region-row-item.region-city-active .region-col:nth-child(2),
.region-row-item.region-district-active .region-col:nth-child(3) {
  z-index: 40;
}

.picker-trigger.region-trigger {
  padding: 0 12rpx;
}

.picker-value.region-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 26rpx;
}

.picker-dropdown.region-dropdown {
  min-width: 240rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.form-input,
.picker-field {
  width: 100%;
  min-height: 72rpx;
  line-height: 72rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.picker-wrap {
  position: relative;
}

.picker-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
  padding: 0 20rpx;
}

.picker-trigger.disabled {
  opacity: 0.6;
}

.picker-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.picker-value.placeholder {
  color: #999;
}

.picker-arrow {
  margin-left: 12rpx;
  font-size: 20rpx;
  color: #999;
}

.picker-arrow.open {
  transform: rotate(180deg);
}

.picker-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 20;
}

.picker-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 8rpx);
  max-height: 420rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
  z-index: 30;
}

.picker-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 24rpx;
  font-size: 28rpx;
  color: #333;
  border-bottom: 1rpx solid #f5f5f5;
}

.picker-option.active {
  color: #2979ff;
}

.picker-check {
  color: #2979ff;
  font-size: 24rpx;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.save-btn {
  background: #2979ff;
  color: #fff;
  border-radius: 48rpx;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 80rpx 0;
}

.form-divider {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 8rpx 0 20rpx;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: #eee;
}

.divider-text {
  font-size: 24rpx;
  color: #999;
}

.form-hint {
  display: block;
  margin: -4rpx 0 12rpx;
  font-size: 22rpx;
  color: #999;
  line-height: 1.5;
}

.map-scope-card {
  display: flex;
  align-items: center;
  min-height: 88rpx;
  background: #f8faff;
  border: 1rpx solid #dbe7ff;
  border-radius: 12rpx;
  padding: 20rpx;
}

.map-scope-content {
  flex: 1;
  min-width: 0;
}

.map-scope-title {
  display: block;
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
}

.map-scope-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #2979ff;
}

.map-scope-placeholder {
  flex: 1;
  font-size: 28rpx;
  color: #999;
}

.map-scope-arrow {
  margin-left: 12rpx;
  font-size: 36rpx;
  color: #999;
  line-height: 1;
}

.clear-map-btn {
  display: inline-block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #2979ff;
}
</style>
