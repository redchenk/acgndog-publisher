# ACGNDOG 文章爬取发布 Skill

从 acgndog.com 爬取文章并发布到 Halo 博客。

## 功能

- 从 acgndog.com 爬取最新文章
- 提取标题、封面图、作者、简介等内容
- 格式化文章内容（标题、作者、简介、内容段落）
- 发布为 Halo 草稿文章
- 自动设置封面图

## 使用方式

```bash
cd /home/node/.openclaw/workspace/scripts
NODE_PATH=/usr/local/lib/node_modules node publish-articles.js
```

## 配置

脚本中已配置：
- HALO_URL: https://www.redchenk.com
- SOURCE_URL: https://www.acgndog.com
- 登录凭据在脚本中硬编码

## 输出

- 每次发布 3 篇草稿文章
- 文章包含：标题、作者、简介、内容、原文链接
- 封面图自动设置
