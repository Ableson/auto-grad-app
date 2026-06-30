<template>
  <view class="apply-page">
    <view v-if="readOnly" class="approved-box">
      <text class="approved-title">入驻已通过</text>
      <text class="approved-tip">以下为入驻信息，客户管理请前往工作台</text>
    </view>

    <view v-if="rejectedInfo.show" class="reject-box">
      <text class="reject-title">审核未通过</text>
      <text class="reject-reason">{{ rejectedInfo.auditRemark || '暂无拒绝原因，请联系平台了解详情' }}</text>
      <text v-if="rejectedInfo.auditTime" class="reject-time">审核时间：{{ formatTime(rejectedInfo.auditTime) }}</text>
      <text class="reject-tip">请修改以下信息后重新提交</text>
    </view>

    <view v-if="readOnly" class="form-card">
      <view class="form-item readonly">
        <text class="label">机构名称</text>
        <text class="readonly-value">{{ displayValue(form.agencyName) }}</text>
      </view>
      <view class="form-item readonly">
        <text class="label">联系人</text>
        <text class="readonly-value">{{ displayValue(form.contactName) }}</text>
      </view>
      <view class="form-item readonly">
        <text class="label">联系电话</text>
        <text class="readonly-value">{{ displayValue(form.contactPhone) }}</text>
      </view>
      <view class="form-item readonly">
        <text class="label">所在省份</text>
        <text class="readonly-value">{{ displayValue(form.provinceName) }}</text>
      </view>
      <view class="form-item readonly">
        <text class="label">所在城市</text>
        <text class="readonly-value">{{ displayValue(form.cityName) }}</text>
      </view>
      <view class="form-item readonly">
        <text class="label">详细地址</text>
        <text class="readonly-value">{{ displayValue(form.address) }}</text>
      </view>
      <view class="form-item readonly">
        <text class="label">资质编号</text>
        <text class="readonly-value">{{ displayValue(form.licenseNo) }}</text>
      </view>
      <view class="form-item readonly column">
        <text class="label">机构简介</text>
        <text class="readonly-value block">{{ displayValue(form.intro) }}</text>
      </view>
    </view>

    <view v-else>
      <view class="form-card">
        <view class="form-item">
          <text class="label required">机构名称</text>
          <input v-model="form.agencyName" class="input" placeholder="请输入机构全称" />
        </view>
        <view class="form-item">
          <text class="label">联系人</text>
          <input v-model="form.contactName" class="input" placeholder="请输入联系人姓名" />
        </view>
        <view class="form-item">
          <text class="label required">联系电话</text>
          <input v-model="form.contactPhone" class="input" type="number" maxlength="11" placeholder="请输入手机号" />
        </view>

        <view class="form-item picker-item" :class="{ active: provinceDropdownOpen }">
          <text class="label">所在省份</text>
          <view class="picker-wrap">
            <view
              v-if="provinceDropdownOpen"
              class="picker-mask"
              @click="closeProvinceDropdown"
            ></view>
            <view class="picker-trigger" @click.stop="toggleProvinceDropdown">
              <text :class="['picker-value', { placeholder: !form.provinceName }]">
                {{ form.provinceName || '请选择省份' }}
              </text>
              <text class="picker-arrow" :class="{ open: provinceDropdownOpen }">▼</text>
            </view>
            <scroll-view
              v-if="provinceDropdownOpen"
              scroll-y
              class="picker-dropdown"
              @click.stop
            >
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
          <text class="label">所在城市</text>
          <view class="picker-wrap">
            <view
              v-if="cityDropdownOpen"
              class="picker-mask"
              @click="closeCityDropdown"
            ></view>
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
            <scroll-view
              v-if="cityDropdownOpen"
              scroll-y
              class="picker-dropdown"
              @click.stop
            >
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
          <text class="label">详细地址</text>
          <input v-model="form.address" class="input" placeholder="办公地址" />
        </view>
        <view class="form-item">
          <text class="label">资质编号</text>
          <input v-model="form.licenseNo" class="input" placeholder="营业执照或资质证号" />
        </view>
        <view class="form-item column">
          <text class="label">机构简介</text>
          <textarea v-model="form.intro" class="textarea" maxlength="500" placeholder="简要介绍机构业务范围" />
        </view>
      </view>

      <view class="tip-box">
        <text>提交后将由平台审核，审核通过后可前往工作台进行客户管理。</text>
      </view>

      <button class="submit-btn" :loading="submitting" @click="handleSubmit">
        {{ rejectedInfo.show ? '重新提交申请' : '提交申请' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getToken } from '@/utils/auth'
import { getAgencyApplyStatus, submitAgencyApply, getMyAgencyInfo } from '@/api/agency'
import { useAreaStore } from '@/store'

const areaStore = useAreaStore()
const readOnly = ref(false)
const form = ref(createEmptyForm())
const submitting = ref(false)
const selectedProvinceId = ref('')
const rejectedInfo = ref({
  show: false,
  auditRemark: '',
  auditTime: ''
})

const provinceOptions = computed(() => areaStore.provinces)
const provinceDropdownOpen = ref(false)
const cityDropdownOpen = ref(false)

const cityOptions = computed(() => {
  if (!selectedProvinceId.value) return []
  return areaStore.getCitiesByProvinceId(selectedProvinceId.value, form.value.cityName)
})

function createEmptyForm() {
  return {
    agencyName: '',
    contactName: '',
    contactPhone: '',
    provinceName: '',
    cityName: '',
    address: '',
    licenseNo: '',
    intro: ''
  }
}

function formatTime(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 19)
}

function displayValue(value) {
  return value || '-'
}

function areaFullName(area) {
  return areaStore.getAreaFullName(area)
}

function isSameArea(area, name) {
  if (!area || !name) return false
  return areaStore.getAreaFullName(area) === name || area.name === name
}

function fillFormFromAgency(agency) {
  if (!agency) return
  form.value = {
    agencyName: agency.name || '',
    contactName: agency.contactName || '',
    contactPhone: agency.contactPhone || '',
    provinceName: agency.provinceName || '',
    cityName: agency.cityName || '',
    address: agency.address || '',
    licenseNo: agency.licenseNo || '',
    intro: agency.remark || ''
  }
}

function fillFormFromApply(apply) {
  if (!apply) return
  const province = areaStore.findProvinceByName(apply.provinceName)
  selectedProvinceId.value = province?.id || ''
  const city = province ? areaStore.findCityByName(province.id, apply.cityName) : null
  form.value = {
    agencyName: apply.agencyName || '',
    contactName: apply.contactName || '',
    contactPhone: apply.contactPhone || '',
    provinceName: province ? areaStore.getAreaFullName(province) : apply.provinceName || '',
    cityName: city ? areaStore.getAreaFullName(city) : apply.cityName || '',
    address: apply.address || '',
    licenseNo: apply.licenseNo || '',
    intro: apply.intro || ''
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

onLoad(async () => {
  if (!getToken()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login' }), 500)
    return
  }
  try {
    await areaStore.ensureLoaded()
  } catch (err) {
    console.warn('加载区划失败', err)
  }
  try {
    const res = await getAgencyApplyStatus()
    const data = res.data || res
    if (data.isAgencyStaff) {
      readOnly.value = true
      const infoRes = await getMyAgencyInfo()
      const info = infoRes.data || infoRes
      fillFormFromAgency(info.agency)
      return
    }
    if (data.applyStatus === '0') {
      uni.showModal({
        title: '提示',
        content: '您已有待审核的申请，请耐心等待',
        showCancel: false,
        success: () => uni.navigateBack()
      })
      return
    }
    if (data.applyStatus === '2') {
      rejectedInfo.value = {
        show: true,
        auditRemark: data.auditRemark || '',
        auditTime: data.auditTime || ''
      }
      fillFormFromApply(data.lastApply)
    }
  } catch (err) {
    console.warn('加载入驻状态失败', err)
  }
})

function validate() {
  if (!form.value.agencyName.trim()) {
    uni.showToast({ title: '请填写机构名称', icon: 'none' })
    return false
  }
  if (!/^1\d{10}$/.test(form.value.contactPhone || '')) {
    uni.showToast({ title: '请填写正确手机号', icon: 'none' })
    return false
  }
  return true
}

async function handleSubmit() {
  if (!validate() || submitting.value) return
  submitting.value = true
  try {
    await submitAgencyApply(form.value)
    uni.showToast({ title: '提交成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (err) {
    uni.showToast({ title: err.msg || err.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.apply-page {
  min-height: 100vh;
  background: #f4f4f4;
  padding: 24rpx;
  box-sizing: border-box;
}

.reject-box {
  background: #fff5f5;
  border: 1rpx solid #ffd6d6;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.reject-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #f56c6c;
}

.reject-reason {
  display: block;
  margin-top: 12rpx;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.reject-time {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
}

.reject-tip {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #2979ff;
}

.approved-box {
  background: #eef4ff;
  border: 1rpx solid #c8dcff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.approved-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #2979ff;
}

.approved-tip {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.form-item.readonly {
  align-items: flex-start;
}

.readonly-value {
  flex: 1;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  text-align: right;
}

.readonly-value.block {
  width: 100%;
  margin-top: 16rpx;
  text-align: left;
}

.form-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx 24rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item.column {
  flex-direction: column;
  align-items: flex-start;
}

.form-item.picker-item.active {
  z-index: 40;
}

.form-item.picker-item {
  position: relative;
  z-index: 1;
}

.label {
  width: 180rpx;
  font-size: 28rpx;
  color: #333;
  flex-shrink: 0;
}

.label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4rpx;
}

.input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.picker-wrap {
  flex: 1;
  position: relative;
}

.picker-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44rpx;
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
  transition: transform 0.2s;
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

.textarea {
  width: 100%;
  min-height: 180rpx;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #333;
}

.tip-box {
  margin: 24rpx 8rpx;
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
}

.submit-btn {
  margin-top: 32rpx;
  background: #2979ff;
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
}
</style>
