# ACGNDOG Publisher

从 [acgndog.com](https://www.acgndog.com) 爬取漫画、轻小说等资源文章，发布到 Halo 博客。

## 功能

- 自动爬取 acgndog.com 最新文章
- 提取标题、作者、简介、封面图
- 格式化文章内容
- 发布为 Halo 草稿文章
- 自动设置封面图

## 使用方法

```bash
# 安装依赖
npm install playwright

# 运行脚本
cd acgndog-publisher
NODE_PATH=/usr/local/lib/node_modules node publish.js
```

## 配置

脚本中已包含配置：
- HALO_URL: https://www.redchenk.com
- 登录凭据：redchenk / @Aa620880123

## 输出

- 每次发布 3 篇草稿文章
- 文章格式：标题 → 作者 → 简介 → 内容 → 原文链接
- 封面图自动设置

## 环境要求

- Node.js
- Playwright
- Chrome/Chromium 浏览器
