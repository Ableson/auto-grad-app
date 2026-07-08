/** 会员保护 API 路径常量（与后端 house_member_protect_path.path_pattern 对应） */

/** 法拍原站链接 */
export const MEMBER_API_PATH_AUCTION_LINK = '/house/auction/member/link'

export function buildAuctionLinkPath(dataId) {
  if (!dataId) {
    return MEMBER_API_PATH_AUCTION_LINK
  }
  return `${MEMBER_API_PATH_AUCTION_LINK}/${dataId}`
}
