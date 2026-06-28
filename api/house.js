import request from '@/utils/request'

// 查询房源分页列表
export function getHouseList(query) {
  // return request({
  //   url: '/system/house/list',
  //   method: 'get',
  //   params: query
  // })
  let res = {
    "code": 200,
    "msg": "操作成功",
    "data": {
      "total": 128,
      "rows": [
        {
          "id": 1,
          "houseName": "城东阳光小区一室一厅",
          "address": "成都市武侯区天府大道123号",
          "price": 1800,
          "area": 65,
          "houseType": "一室一厅",
          "status": "0",
          "statusName": "空置",
          "ownerName": "张三",
          "ownerPhone": "13800138000",
          "createTime": "2026-06-24 10:20:30"
        },
        {
          "id": 2,
          "houseName": "城西华府两室精装",
          "address": "成都市青羊区光华路45号",
          "price": 2600,
          "area": 89,
          "houseType": "两室一厅",
          "status": "1",
          "statusName": "已出租",
          "ownerName": "李四",
          "ownerPhone": "13900139000",
          "createTime": "2026-06-23 15:10:22"
        }
      ]
    }
  }
  return res
}