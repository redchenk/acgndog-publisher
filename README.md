# ACGNDOG Publisher

从 [acgndog.com](https://www.acgndog.com) 爬取漫画、轻小说等资源文章，发布到 Halo 博客。

## 功能

- 自动爬取 acgndog.com 最新文章
- **自动去重**：检查本地记录和 Halo 已发布文章，避免重复发布
- 提取标题、作者、简介、封面图
- 格式化文章内容
- 发布为 Halo 草稿文章
- 自动设置封面图
- 每次只发布 1 篇新文章

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
- 登录凭据：你的 Halo 用户名 / 密码/ token

## 去重机制

脚本会检查两个来源来避免重复：
1. **本地记录** (`published.json`)：记录已发布文章的 URL
2. **Halo API**：获取 Halo 博客中已有的所有文章标题

首次运行会从 Halo 同步已有文章标题，之后只发布新文章。

## 输出

- 每次运行最多发布 1 篇新草稿文章
- 文章格式：标题 → 作者 → 简介 → 内容 → 原文链接（超链接）
- 封面图自动设置
- 自动设置分类：文章
- 自动设置标签：资源共享

## 环境要求

- Node.js
- Playwright
- Chrome/Chromium 浏览器
