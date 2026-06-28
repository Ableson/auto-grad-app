export const FILE_TYPE_COVER = 1
export const FILE_TYPE_DETAIL_IMAGE = 2
export const FILE_TYPE_ATTACHMENT = 3

export const FILE_TYPE_OPTIONS = [
  { value: FILE_TYPE_COVER, label: '封面图片' },
  { value: FILE_TYPE_DETAIL_IMAGE, label: '详情图片' },
  { value: FILE_TYPE_ATTACHMENT, label: '附件文档' }
]

export function getFileTypeText(type) {
  const item = FILE_TYPE_OPTIONS.find(option => option.value === type)
  return item ? item.label : '未知'
}

export function isImageSuffix(suffix) {
  const ext = String(suffix || '').toLowerCase().replace(/^\./, '')
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
}
