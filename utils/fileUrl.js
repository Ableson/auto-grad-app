import config from '@/config'

function joinBase(base, path) {
  if (!base) return path || ''
  if (!path) return base
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return normalizedBase + normalizedPath
}

/** 将库内 fileUrl/imgPath 转为客户端可访问地址 */
export function resolveFileUrl(url) {
  if (!url) return ''
  const trimmed = String(url).trim()
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }
  if (trimmed.startsWith('/profile/')) {
    const apiBase = (config.file && config.file.apiPublicBaseUrl) || config.baseUrl
    return joinBase(apiBase, trimmed)
  }
  const auctionIdx = trimmed.indexOf('/auction/')
  if (auctionIdx >= 0) {
    const minioBase = (config.file && config.file.minioPublicBaseUrl) || ''
    return joinBase(minioBase, trimmed.substring(auctionIdx))
  }
  return trimmed
}
