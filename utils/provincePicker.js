let resolver = null
let pickingProvince = false

export function isPickingProvince() {
  return pickingProvince
}

export function openProvincePicker(current = '') {
  return new Promise((resolve) => {
    resolver = resolve
    pickingProvince = true
    const query = current ? `?current=${encodeURIComponent(current)}` : ''
    uni.navigateTo({
      url: `/pages/common/province/index${query}`
    })
  })
}

export function resolveProvincePicker(provinceName) {
  if (resolver) {
    resolver(provinceName)
    resolver = null
  }
}

export function finishProvincePicker() {
  pickingProvince = false
}
