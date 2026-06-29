import { createPinia } from 'pinia'
import { useUserStore } from './modules/user'
import { useConfigStore } from './modules/config'
import { useAreaStore } from './modules/area'

const pinia = createPinia()

export default pinia

export { useUserStore, useConfigStore, useAreaStore }
