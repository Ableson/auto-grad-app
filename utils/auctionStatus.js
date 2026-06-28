export const AUCTION_STATUS_OPTIONS = [
  { value: 1, label: '一拍' },
  { value: 2, label: '二拍' },
  { value: 3, label: '变卖' }
]

export function getAuctionStatusLabel(value) {
  const item = AUCTION_STATUS_OPTIONS.find(option => option.value === value)
  return item ? item.label : '-'
}
