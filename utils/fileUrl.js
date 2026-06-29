import config from '@/config'
import { useConfigStore } from '@/store/modules/config'

function joinBase(base, path) {
  if (!base) return path || ''
  if (!path) return base
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return normalizedBase + normalizedPath
}

function getFileBases() {
  const server = useConfigStore().serverConfig || {}
  return {
    apiBase: server.apiPublicBaseUrl || config.baseUrl,
    minioBase: server.minioPublicBaseUrl || ''
  }
}

/** 将库内 fileUrl/imgPath 转为客户端可访问地址（库内 MinIO 仅存 /auction/...） */
export function resolveFileUrl(url) {
  if (!url) return ''
  const trimmed = String(url).trim()
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }
  const { apiBase, minioBase } = getFileBases()
  if (trimmed.startsWith('/profile/')) {
    return joinBase(apiBase, trimmed)
  }
  if (trimmed.startsWith('/auction/')) {
    return joinBase(minioBase, trimmed)
  }
  if (trimmed.startsWith('auction/')) {
    return joinBase(minioBase, `/${trimmed}`)
  }
  return trimmed
}
