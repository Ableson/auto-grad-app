<template>
  <view class="detail-page">
    <view v-if="loading" class="empty-tip">加载中...</view>
    <template v-else-if="detail">
      <view class="user-bar">
        <image :src="resolveAvatar(detail.avatar)" class="avatar" mode="aspectFill" @click="goProfile" />
        <view class="user-info">
          <text class="name">{{ displayName }}</text>
          <text class="sub">用户ID：{{ detail.customerUserId }}</text>
        </view>
        <view class="match-entry" @click="openMatchHouses">
          <text class="match-num">{{ detail.matchHouseCount || 0 }}</text>
          <text class="match-label">匹配房源</text>
        </view>
      </view>

      <view class="form-card">
        <view class="form-item picker-item" :class="{ active: provinceDropdownOpen }">
          <text class="form-label">关注省份</text>
          <view class="picker-wrap">
            <view v-if="provinceDropdownOpen" class="picker-mask" @click="closeProvinceDropdown"></view>
            <view class="picker-trigger" @click.stop="toggleProvinceDropdown">
              <text :class="['picker-value', { placeholder: !form.provinceName }]">
                {{ form.provinceName || '请选择省份' }}
              </text>
              <text class="picker-arrow" :class="{ open: provinceDropdownOpen }">▼</text>
            </view>
            <scroll-view v-if="provinceDropdownOpen" scroll-y class="picker-dropdown" @click.stop>
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

        <view class="form-item picker-item" :class="{ active: cityDropdownOpen }">
          <text class="form-label">关注城市</text>
          <view class="picker-wrap">
            <view v-if="cityDropdownOpen" class="picker-mask" @click="closeCityDropdown"></view>
            <view
              class="picker-trigger"
              :class="{ disabled: !form.provinceName }"
              @click.stop="toggleCityDropdown"
            >
              <text :class="['picker-value', { placeholder: !form.cityName }]">
                {{ form.cityName || (form.provinceName ? '请选择城市' : '请先选择省份') }}
              </text>
              <text class="picker-arrow" :class="{ open: cityDropdownOpen }">▼</text>
            </view>
            <scroll-view v-if="cityDropdownOpen" scroll-y class="picker-dropdown" @click.stop>
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
        <button class="save-btn" :loading="saving" @click="handleSave">保存需求</button>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getToken } from '@/utils/auth'
import { getAgencyRequirementDetail, updateAgencyRequirement } from '@/api/agency'
import { useAreaStore } from '@/store'
import config from '@/config'
import defAva from '@/static/images/profile.jpg'

const baseUrl = config.baseUrl
const itemTypeOptions = ['住宅', '商业', '车辆', '土地', '股权', '其他']
const areaStore = useAreaStore()

const userId = ref(null)
const detail = ref(null)
const loading = ref(false)
const saving = ref(false)
const selectedProvinceId = ref('')
const provinceDropdownOpen = ref(false)
const cityDropdownOpen = ref(false)

const form = ref({
  provinceName: '',
  cityName: '',
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

const displayName = computed(() => {
  if (!detail.value) return '用户'
  if (detail.value.nickName) return detail.value.nickName
  return `用户${detail.value.customerUserId}`
})

onLoad(async (options) => {
  if (!getToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  userId.value = options.userId
  await areaStore.ensureLoaded()
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

function applyRegionData(provinceNames, cityNames) {
  const provinceName = firstCsv(provinceNames)
  const cityName = firstCsv(cityNames)
  const province = provinceName ? areaStore.findProvinceByName(provinceName) : null
  selectedProvinceId.value = province?.id || ''
  form.value.provinceName = province ? areaStore.getAreaFullName(province) : provinceName
  if (province && cityName) {
    const city = areaStore.findCityByName(province.id, cityName)
    form.value.cityName = city ? areaStore.getAreaFullName(city) : cityName
  } else {
    form.value.cityName = cityName
  }
}

function toggleProvinceDropdown() {
  cityDropdownOpen.value = false
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
  cityDropdownOpen.value = !cityDropdownOpen.value
}

function closeCityDropdown() {
  cityDropdownOpen.value = false
}

function selectProvince(province) {
  if (selectedProvinceId.value !== province.id) {
    selectedProvinceId.value = province.id
    form.value.provinceName = areaStore.getAreaFullName(province)
    form.value.cityName = ''
  }
  closeProvinceDropdown()
}

function selectCity(city) {
  form.value.cityName = areaStore.getAreaFullName(city)
  closeCityDropdown()
}

function resolveAvatar(avatar) {
  if (!avatar) return defAva
  if (/^https?:\/\//.test(avatar)) return avatar
  return baseUrl + avatar
}

function goProfile() {
  uni.navigateTo({ url: `/pages/work/customer/profile?userId=${userId.value}` })
}

function openMatchHouses() {
  const name = encodeURIComponent(displayName.value)
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
    const res = await getAgencyRequirementDetail(userId.value)
    const data = res.data || res
    detail.value = data
    applyRegionData(data.provinceNames, data.cityNames)
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

async function handleSave() {
  if (saving.value) return
  saving.value = true
  try {
    await updateAgencyRequirement(userId.value, {
      provinceNames: form.value.provinceName || null,
      cityNames: form.value.cityName || null,
      minStartPriceYuan: toNumber(form.value.minStartPriceYuan),
      maxStartPriceYuan: toNumber(form.value.maxStartPriceYuan),
      minDepositYuan: toNumber(form.value.minDepositYuan),
      maxDepositYuan: toNumber(form.value.maxDepositYuan),
      itemType: form.value.itemType || null
    })
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
</style>
