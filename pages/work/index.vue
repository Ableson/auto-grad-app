<template>
  <view class="work-container">
    <!-- 轮播图 -->
    <uni-swiper-dot class="uni-swiper-dot-box" :info="data" :current="current" field="content">
      <swiper class="swiper-box" :current="swiperDotIndex" @change="changeSwiper">
        <swiper-item v-for="(item, index) in data" :key="index">
          <view class="swiper-item" @click="clickBannerItem(item)">
            <image :src="item.image" mode="aspectFill" :draggable="false" />
          </view>
        </swiper-item>
      </swiper>
    </uni-swiper-dot>

    <!-- 业务功能 -->
    <uni-section title="业务功能" type="line"></uni-section>
    <view class="grid-body">
      <uni-grid :column="4" :showBorder="false" @change="changeBizGrid">
        <uni-grid-item>
          <view class="grid-item-box">
            <uni-icons type="map-pin" size="30" color="#2979ff"></uni-icons>
            <text class="text">地图找房</text>
          </view>
        </uni-grid-item>
      </uni-grid>
    </view>

    <!-- 宫格组件 -->
    <uni-section title="系统管理" type="line"></uni-section>
    <view class="grid-body">
      <uni-grid :column="4" :showBorder="false">
        <uni-grid-item v-for="item in systemGridItems" :key="item.key">
          <view class="grid-item-box" @click="handleSystemGrid(item)">
            <uni-icons :type="item.icon" size="30" :color="item.color || '#666'"></uni-icons>
            <text class="text">{{ item.label }}</text>
          </view>
        </uni-grid-item>
      </uni-grid>
    </view>
  </view>
</template>

<script setup>
  import { ref, computed, getCurrentInstance } from "vue"
  import { onShow } from "@dcloudio/uni-app"
  import { getToken } from '@/utils/auth'
  import { getAgencyApplyStatus } from '@/api/agency'

  const { proxy } = getCurrentInstance()
  const current = ref(0)
  const swiperDotIndex = ref(0)
  const isAgencyStaff = ref(false)
  const data = ref([{ image: '/static/images/banner/banner01.jpg' }, { image: '/static/images/banner/banner02.jpg' }, { image: '/static/images/banner/banner03.jpg' }])

  const systemGridItems = computed(() => {
    const items = []
    if (isAgencyStaff.value) {
      items.push({
        key: 'customer',
        label: '客户管理',
        icon: 'person-filled',
        color: '#2979ff',
        path: '/pages/work/customer/index'
      })
      items.push({
        key: 'requirement',
        label: '客户需求',
        icon: 'list',
        color: '#2979ff',
        path: '/pages/work/requirement/index'
      })
    } else {
      items.push({ key: 'role', label: '角色管理', icon: 'staff-filled' })
    }
    items.push(
      { key: 'menu', label: '菜单管理', icon: 'color' },
      { key: 'dept', label: '部门管理', icon: 'settings-filled' },
      { key: 'post', label: '岗位管理', icon: 'heart-filled' },
      { key: 'dict', label: '字典管理', icon: 'bars' },
      { key: 'config', label: '参数设置', icon: 'gear-filled' },
      { key: 'notice', label: '通知公告', icon: 'chat-filled' },
      { key: 'log', label: '日志管理', icon: 'wallet-filled' }
    )
    return items
  })

  onShow(() => {
    refreshAgencyStatus()
  })

  async function refreshAgencyStatus() {
    if (!getToken()) {
      isAgencyStaff.value = false
      return
    }
    try {
      const res = await getAgencyApplyStatus()
      const statusData = res.data || res
      isAgencyStaff.value = !!statusData.isAgencyStaff
    } catch (err) {
      isAgencyStaff.value = false
    }
  }

  function clickBannerItem(item) {
    console.info(item)
  }

  function changeSwiper(e) {
    current.value = e.detail.current
  }

  function changeBizGrid(e) {
    if (e.detail.index === 0) {
      proxy.$tab.switchTab('/pages/house/map')
      return
    }
    proxy.$modal.showToast('模块建设中~')
  }

  function handleSystemGrid(item) {
    if (item.path) {
      proxy.$tab.navigateTo(item.path)
      return
    }
    proxy.$modal.showToast('模块建设中~')
  }
</script>

<style lang="scss" scoped>
  /* #ifndef APP-NVUE */
  page {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background-color: #fff;
    min-height: 100%;
    height: auto;
  }

  view {
    font-size: 14px;
    line-height: inherit;
  }
  /* #endif */

  .text {
    text-align: center;
    font-size: 26rpx;
    margin-top: 10rpx;
  }

  .grid-item-box {
    flex: 1;
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 15px 0;
  }

  .uni-margin-wrap {
    width: 690rpx;
    width: 100%;
    ;
  }

  .swiper {
    height: 300rpx;
  }

  .swiper-box {
    height: 150px;
  }

  .swiper-item {
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #fff;
    height: 300rpx;
    line-height: 300rpx;
  }

  @media screen and (min-width: 500px) {
    .uni-swiper-dot-box {
      width: 400px;
      /* #ifndef APP-NVUE */
      margin: 0 auto;
      /* #endif */
      margin-top: 8px;
    }

    .image {
      width: 100%;
    }
  }
</style>
