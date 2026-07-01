import { defineStore } from 'pinia'
import { ref } from 'vue'
import config from '@/config'
import storage from '@/utils/storage'
import constant from '@/utils/constant'
import { isHttp, isEmpty } from "@/utils/validate"
import { getInfo, login, logout, wxLogin } from '@/api/login'
import { getAgencyApplyStatus } from '@/api/agency'
import { getToken, removeToken, setToken } from '@/utils/auth'
import { useAreaStore } from '@/store/modules/area'
import defAva from '@/static/images/profile.jpg'

const baseUrl = config.baseUrl

function readStoredBool(key) {
  const value = storage.get(key)
  return value === true || value === 'true' || value === 1 || value === '1'
}

function readStoredString(key) {
  const value = storage.get(key)
  return value || null
}

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const id = ref(storage.get(constant.id))
  const name = ref(storage.get(constant.name))
  const phone = ref(storage.get(constant.phone))
  const avatar = ref(storage.get(constant.avatar))
  const roles = ref(storage.get(constant.roles))
  const permissions = ref(storage.get(constant.permissions))
  const isAgencyStaff = ref(readStoredBool(constant.isAgencyStaff))
  const agencyApplyStatus = ref(readStoredString(constant.agencyApplyStatus))

  const SET_TOKEN = (val) => {
    token.value = val
  }
  const SET_ID = (val) => {
    id.value = val
    storage.set(constant.id, val)
  }
  const SET_NAME = (val) => {
    name.value = val
    storage.set(constant.name, val)
  }
  const SET_PHONE = (val) => {
    phone.value = val
    storage.set(constant.phone, val)
  }
  const SET_AVATAR = (val) => {
    avatar.value = val
    storage.set(constant.avatar, val)
  }
  const SET_ROLES = (val) => {
    roles.value = val
    storage.set(constant.roles, val)
  }
  const SET_PERMISSIONS = (val) => {
    permissions.value = val
    storage.set(constant.permissions, val)
  }
  const SET_AGENCY_STAFF = (val) => {
    isAgencyStaff.value = !!val
    storage.set(constant.isAgencyStaff, !!val)
  }
  const SET_AGENCY_APPLY_STATUS = (val) => {
    agencyApplyStatus.value = val || null
    storage.set(constant.agencyApplyStatus, val || '')
  }
  const clearAgencyStatus = () => {
    isAgencyStaff.value = false
    agencyApplyStatus.value = null
    storage.set(constant.isAgencyStaff, false)
    storage.set(constant.agencyApplyStatus, '')
  }
  const refreshAgencyStatus = () => {
    if (!getToken()) {
      clearAgencyStatus()
      return Promise.resolve()
    }
    return getAgencyApplyStatus().then(res => {
      const data = res.data || res
      SET_AGENCY_STAFF(!!data.isAgencyStaff)
      SET_AGENCY_APPLY_STATUS(data.applyStatus)
    }).catch(() => {
      clearAgencyStatus()
    })
  }

  // 登录
  const loginAction = (userInfo) => {
    const username = userInfo.username.trim()
    const password = userInfo.password
    const code = userInfo.code
    const uuid = userInfo.uuid
    return new Promise((resolve, reject) => {
      login(username, password, code, uuid).then(res => {
        setToken(res.token)
        SET_TOKEN(res.token)
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 微信一键登录
  const wxLoginAction = (profile = {}) => {
    return new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: (loginRes) => {
          if (!loginRes.code) {
            reject(new Error('获取微信 code 失败'))
            return
          }
          wxLogin(loginRes.code, profile).then(res => {
            setToken(res.token)
            SET_TOKEN(res.token)
            resolve()
          }).catch(error => {
            reject(error)
          })
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  // 获取用户信息
  const getInfoAction = () => {
    return new Promise((resolve, reject) => {
      getInfo().then(res => {
        const user = res.user
        let avatar = user.avatar || ""
        if (!isHttp(avatar)) {
          avatar = (isEmpty(avatar)) ? defAva : baseUrl + avatar
        }
        const userid = (isEmpty(user) || isEmpty(user.userId)) ? "" : user.userId
        const username = (isEmpty(user) || isEmpty(user.userName)) ? "" : user.userName
        const nickname = (isEmpty(user) || isEmpty(user.nickName)) ? "" : user.nickName
        const phonenumber = (isEmpty(user) || isEmpty(user.phonenumber)) ? "" : user.phonenumber
        const phoneFromUserName = /^1\d{10}$/.test(username || '') ? username : ''
        if (res.roles && res.roles.length > 0) {
          SET_ROLES(res.roles)
          SET_PERMISSIONS(res.permissions)
        } else {
          SET_ROLES(['ROLE_DEFAULT'])
        }
		SET_ID(userid)
        SET_NAME(nickname || username)
        SET_PHONE(phonenumber || phoneFromUserName)
        SET_AVATAR(avatar)
        return refreshAgencyStatus().then(() => resolve(res))
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 退出系统
  const logOutAction = () => {
    return new Promise((resolve, reject) => {
      logout(token.value).then(() => {
        resetLocalSession()
        useAreaStore().clearArea()
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  }

  /** 仅清除本地登录态（不请求后端），用于会话过期等场景 */
  const resetLocalSession = () => {
    SET_TOKEN('')
    SET_ROLES([])
    SET_PERMISSIONS([])
    clearAgencyStatus()
    removeToken()
    storage.clean()
  }

  return {
    token,
    id,
    name,
    phone,
    avatar,
    roles,
    permissions,
    isAgencyStaff,
    agencyApplyStatus,
    SET_AVATAR,
    SET_PHONE,
    clearAgencyStatus,
    refreshAgencyStatus,
    login: loginAction,
    wxLogin: wxLoginAction,
    getInfo: getInfoAction,
    logOut: logOutAction,
    resetLocalSession
  }
})
