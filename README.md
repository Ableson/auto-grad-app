<p align="center">
	<img alt="logo" src="https://oscimg.oschina.net/oscnet/up-43e3941654fa3054c9684bf53d1b1d356a1.png">
</p>
<h1 align="center" style="margin: 30px 0 30px; font-weight: bold;">RuoYi v1.2.0</h1>
<h4 align="center">基于UniApp开发的轻量级移动端框架</h4>
<p align="center">
	<a href="https://gitee.com/y_project/RuoYi-App/stargazers"><img src="https://gitee.com/y_project/RuoYi-App/badge/star.svg?theme=dark"></a>
	<a href="https://gitee.com/y_project/RuoYi-App"><img src="https://img.shields.io/badge/RuoYi-v1.2.0-brightgreen.svg"></a>
	<a href="https://gitee.com/y_project/RuoYi-App/blob/master/LICENSE"><img src="https://img.shields.io/github/license/mashape/apistatus.svg"></a>
</p>

## 平台简介

RuoYi App 移动解决方案，采用uniapp框架，一份代码多终端适配，同时支持APP、小程序、H5！实现了与[RuoYi-Vue](https://gitee.com/y_project/RuoYi-Vue)、[RuoYi-Cloud](https://gitee.com/y_project/RuoYi-Cloud)完美对接的移动解决方案！目前已经实现登录、我的、工作台、编辑资料、头像修改、密码修改、常见问题、关于我们等基础功能。

* 本仓库为前端技术栈 Vue3 + Pinia 版本。
* 配套后端代码仓库地址[RuoYi-Vue](https://gitee.com/y_project/RuoYi-Vue) 或 [RuoYi-Cloud](https://github.com/yangzongzhuan/RuoYi-Cloud) 版本。
* 应用框架基于[uniapp](https://uniapp.dcloud.net.cn/)，支持小程序、H5、Android和IOS。
* 前端组件采用[uni-ui](https://github.com/dcloudio/uni-ui)，全端兼容的高性能UI框架。
* 阿里云折扣场：[点我进入](http://aly.ruoyi.vip)，腾讯云秒杀场：[点我进入](http://txy.ruoyi.vip)&nbsp;&nbsp;

## 技术文档

- 官网网站：[http://ruoyi.vip](http://ruoyi.vip)
- 文档地址：[http://doc.ruoyi.vip](http://doc.ruoyi.vip)
- H5页体验：[http://h5.ruoyi.vip](http://h5.ruoyi.vip)
- QQ交流群： ①133713780(满)、②146013835(满)、③189091635
- 小程序体验

<img src="https://oscimg.oschina.net/oscnet/up-26c76dc90b92acdbd9ac8cd5252f07c8ad9.jpg" alt="小程序演示"/>

# 二次开发

### 在小程序后台配置request合法域名（按使用的 provider）：
```
腾讯：apis.map.qq.com
高德：restapi.amap.com
百度：api.map.baidu.com
```
### 微信小程序里百度 AK 常因以下原因失败，请检查：
```
百度地图开放平台 中 AK 类型选「微信小程序」，并绑定 AppId：wx5bd6921080492df7
微信公众平台 → 开发管理 → 服务器域名，添加 https://api.map.baidu.com
推荐：在 config.js 的 map.keys.tencent 填入 腾讯位置服务 Key（免费），作为自动兜底；微信小程序与腾讯地图兼容性最好
```
### 微信一键登录 获取用户手机号
```
微信小程序后台需开通「手机号快速验证」能力，并配置好 house.wx.app-id / app-secret。
存量用户：需重新一键登录（授权手机号），系统会把账号迁移为手机号，昵称改为 用户+后4位。
若提示「该手机号已被其他账号绑定」，说明该手机号已在系统中绑定其他账号。
```