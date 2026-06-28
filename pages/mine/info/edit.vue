<template>
  <view class="container">
    <view class="example">
      <uni-forms ref="form" :model="user" labelWidth="80px">
        <uni-forms-item label="用户昵称" name="nickName">
          <uni-easyinput v-model="user.nickName" placeholder="绑定手机号后自动生成，也可自行修改" />
        </uni-forms-item>
        <uni-forms-item label="手机号码" name="phonenumber">
          <uni-easyinput v-model="user.phonenumber" placeholder="请输入手机号码" />
        </uni-forms-item>
        <uni-forms-item label="邮箱" name="email">
          <uni-easyinput v-model="user.email" placeholder="选填" />
        </uni-forms-item>
        <uni-forms-item label="性别" name="sex">
          <uni-data-checkbox v-model="user.sex" :localdata="sexs" />
        </uni-forms-item>
      </uni-forms>
      <view v-if="!phoneLocked" class="phone-tip">填写手机号后，登录账号将自动设为手机号，昵称为「用户+后4位」</view>
      <button type="primary" @click="submit">提交</button>
    </view>
  </view>
</template>

<script setup>
  import { getUserProfile, updateHouseUserProfile } from "@/api/system/user"
  import { useUserStore } from '@/store'
  import { ref, computed, getCurrentInstance } from "vue"
  import { onReady } from "@dcloudio/uni-app"

  const { proxy } = getCurrentInstance()
  const userStore = useUserStore()
  const user = ref({
    nickName: "",
    phonenumber: "",
    email: "",
    sex: "0"
  })
  const originPhone = ref("")
  const phoneLocked = computed(() => /^1\d{10}$/.test(originPhone.value))
  const sexs = [{
    text: '男',
    value: "0"
  }, {
    text: '女',
    value: "1"
  }]
  const rules = ref({
    phonenumber: {
      rules: [{
        required: true,
        errorMessage: '手机号码不能为空'
      }, {
        pattern: /^1[3-9]\d{9}$/,
        errorMessage: '请输入正确的手机号码'
      }]
    },
    email: {
      rules: [{
        format: 'email',
        errorMessage: '请输入正确的邮箱地址'
      }]
    }
  })

  function getUser() {
    getUserProfile().then(response => {
      user.value = response.data
      originPhone.value = response.data.phonenumber || ""
      if (!user.value.sex) {
        user.value.sex = "0"
      }
    })
  }

  function submit() {
    proxy.$refs.form.validate().then(() => {
      updateHouseUserProfile(user.value).then(() => {
        proxy.$modal.msgSuccess("修改成功")
        userStore.getInfo().then(() => {
          getUser()
        })
      })
    })
  }

  onReady(() => {
    proxy.$refs.form.setRules(rules.value)
  })

  getUser()
</script>

<style lang="scss" scoped>
  page {
    background-color: #ffffff;
  }

  .example {
    padding: 15px;
    background-color: #fff;
  }

  .phone-tip {
    margin: 0 0 24rpx;
    font-size: 24rpx;
    color: #999;
    line-height: 1.6;
  }
</style>
