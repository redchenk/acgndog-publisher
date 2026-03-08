#!/usr/bin/env node

const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');
const path = require('path');

const HALO_URL = 'https://www.redchenk.com';
const HALO_TOKEN = 'pat_eyJraWQiOiJFMDIxelh2WDlCS2o1RkpMLUh2TTVtc21DS1pLQ0psaV9QeEdxQlBZaDRBIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwOTAiLCJzdWIiOiJyZWRjaGVuayIsImlhdCI6MTc3Mjg1MDQ5MywianRpIjoiOTAzYjE5ZTQtNTVhNS1hOGUzLTVlYjUtODc1MmJkOWJjODFjIiwicGF0X25hbWUiOiJwYXQtZnFpaW1kNTAifQ.NHcXkMYWBTnbcnVivhYTPZ__DbLrbSFgubauCFYiecFjKjnZ9yufu12FfZAlLzs7Ojzv4VoTBpbDcVTUXIo7urIgtXeZNp_u0evac0nolMiOfteqjaSeoLGYoGGFtI_XEJFubLMFxCLjyIEZPrLdTZ4WBUPs9XWJFRKVXxUOi4eUDN_0-jU-lKjETgATToGBaMKZNeNAmzXfjCgJl6Y19fC2nIJIO5GA-9jtbfFS-lGgWtrdj7vBYId0ogleHxtFbYS52YnE0GCxZrmLHKnx1oS5Q-pqyOxxZsCDtCKK297t6DNdohOjelgLibiyLdjJeWks0T-O58C2V37E6-iLUc_WJOqiLBNKToaIYJPytW5dthVjc92eu72jkbf4V822Wi41_Edo9zbAJ6BkKwYfzUhlpq8u-R7gwxH2LMDairku5yisO53JeB7lNWEBKDW1epVhXor04BiSvNbWcwDEHwvNnF3_agunAj_HrruJrn3hZaGvFBHmSp0SWi_zrq8nQTtRft3ZyCYt54O3IJnZH1y_vwKIstB_2izqNDYkuvMpiBlqweetGEd7a9Em8eFa7RmJOJTRcPyl2zhhJhiKikzY5TrpP_lD9tU0XMI1wsOSKoPu4MJtEmhGI6UXr5bY3ZYuIAzhtMVT_lPnpTeTqUNyRrP7BBP_9KHjAbpQutk';
const SOURCE_URL = 'https://www.acgndog.com';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const PUBLISHED_FILE = path.join(__dirname, 'published.json');

function getPublishedArticles() {
  try {
    if (fs.existsSync(PUBLISHED_FILE)) {
      const data = fs.readFileSync(PUBLISHED_FILE, 'utf8');
      return new Set(JSON.parse(data));
    }
  } catch(e) {}
  return new Set();
}

function savePublishedArticle(url) {
  try {
    const published = getPublishedArticles();
    published.add(url);
    fs.writeFileSync(PUBLISHED_FILE, JSON.stringify([...published], null, 2));
  } catch(e) {
    console.log('保存记录失败:', e.message);
  }
}

async function getExistingTitles() {
  return new Promise((resolve) => {
    const titles = new Set();
    const makeRequest = (page = 0) => {
      const u = new URL('/apis/api.console.halo.run/v1alpha1/posts', HALO_URL);
      u.searchParams.set('size', '100');
      u.searchParams.set('page', page.toString());
      
      const req = https.request({
        hostname: u.hostname, port: 443, path: u.pathname + u.search,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${HALO_TOKEN}` }
      }, res => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => {
          try {
            const data = JSON.parse(b);
            if (data.items && data.items.length > 0) {
              data.items.forEach(item => {
                if (item.post && item.post.spec && item.post.spec.title) {
                  titles.add(item.post.spec.title);
                }
              });
              if (data.hasNext) {
                makeRequest(page + 1);
              } else {
                resolve(titles);
              }
            } else {
              resolve(titles);
            }
          } catch(e) {
            resolve(titles);
          }
        });
      });
      req.on('error', () => resolve(titles));
      req.end();
    };
    makeRequest(0);
  });
}

// 获取下载链接
function getDownloadLinks(postId) {
  return new Promise((resolve) => {
    const cookie = 'server_name_session=373bf48a7f53b328a2cd59d8ab6a3649';
    const referer = 'https://www.acgndog.com/' + postId + '.html';
    
    const url = '/wp-admin/admin-ajax.php?action=d2e5b56b75e2f3d4ab412a6d9561faee&44b4443eef5d03373d87fceca1ac7f92%5Btype%5D=getStorage&44b4443eef5d03373d87fceca1ac7f92%5Bid%5D=' + postId;
    
    const options = {
      hostname: 'www.acgndog.com',
      path: url,
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const items = json.customPostStorage?.items || [];
          resolve(items);
        } catch(e) {
          resolve([]);
        }
      });
    });
    
    req.on('error', () => resolve([]));
    req.end();
  });
}

// 清理文本
function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

// 获取文章详情
async function getDetail(url) {
  // 从URL提取文章ID
  const urlMatch = url.match(/\/(\d+)\.html/);
  const postId = urlMatch ? urlMatch[1] : null;
  
  const br = await chromium.launch({ headless: true, executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const p = await br.newPage();
  try {
    await p.goto(url, {timeout: 60000});
    await p.waitForLoadState('networkidle');
    await wait(5000);
    
    const article = await p.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim() || '';
      let cover = document.querySelector('meta[property="og:image"]')?.content || '';
      if (cover) cover = cover.split('?')[0];
      
      const layer = document.querySelector('.inn-layer');
      const ps = layer?.querySelectorAll('p') || [];
      const paragraphs = Array.from(ps).map(pp => pp.textContent.trim()).filter(t => t.length > 15);
      
      let author = '';
      for (const pp of paragraphs) {
        if (pp.includes('作者') || pp.includes('作画') || pp.includes('原著') || pp.includes('漫画：') || pp.includes('小说：')) {
          author = pp;
          break;
        }
      }
      
      // 清理描述，只保留前150字
      const description = paragraphs.slice(0, 2).join(' ').substring(0, 150);
      
      return { title, cover, author, description, paragraphs };
    });
    
    article.url = url;
    article.postId = postId;
    
    // 获取下载链接
    if (postId) {
      console.log(`  [${article.title}] 获取下载链接...`);
      const downloadLinks = await getDownloadLinks(postId);
      article.downloadLinks = downloadLinks;
    }
    
    await br.close();
    return article;
  } catch(e) { 
    console.log('Error fetching:', e.message);
    await br.close(); 
    return null; 
  }
}

// 发布文章
async function publish(article) {
  const br = await chromium.launch({ headless: true, executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await br.newContext({viewport:{width:1920,height:1200}});
  const p = await ctx.newPage();
  try {
    await p.goto(HALO_URL+'/login', {timeout:60000}); await wait(3000);
    await p.fill('input[type="text"], input[type="email"]', 'redchenk');
    await p.fill('input[type="password"]', '@Aa620880123');
    await p.click('button[type="submit"]'); await wait(4000);
    
    await p.goto(HALO_URL+'/console/posts/editor', {timeout:60000}); await wait(10000);
    
    // 标题
    await p.fill('input[placeholder*="标题"]', article.title.substring(0, 100));
    console.log(`[${article.title}] 标题设置完成`);
    
    // 使用 fill 方法输入纯文本内容
    const editor = p.locator('.ProseMirror').first();
    await editor.click();
    await wait(500);
    
    // 纯文本内容（不用HTML格式）
    let content = article.title + '\n\n';
    if (article.author) content += article.author + '\n\n';
    content += '------------------------\n\n';
    content += cleanText(article.description) + '\n\n';
    content += '------------------------\n\n';
    
    // 添加下载链接（替换原文链接）
    if (article.downloadLinks && article.downloadLinks.length > 0) {
      content += '📥 下载链接：\n\n';
      article.downloadLinks.forEach((link, idx) => {
        content += `${idx + 1}. ${link.name}: ${link.url}`;
        if (link.downloadPwd) {
          content += ` 提取码: ${link.downloadPwd.trim()}`;
        }
        content += '\n';
      });
    } else {
      content += '原文链接：' + article.url;
    }
    
    await editor.fill(content);
    console.log(`[${article.title}] 内容设置完成`);
    
    await wait(3000);
    
    // 保存草稿
    await p.click('button:has-text("保存")'); 
    console.log(`[${article.title}] 草稿保存中...`); 
    await wait(6000);
    
    const m = p.url().match(/name=([^&]+)/);
    const pid = m ? m[1] : null;
    
    if (pid) {
      console.log(`[${article.title}] 草稿保存成功! ID: ${pid}`);
      await setCoverApi(pid, article.cover);
      console.log(`[${article.title}] 封面图设置完成`);
      await setCategoryAndTagsApi(pid);
      console.log(`[${article.title}] 分类/标签设置完成`);
      savePublishedArticle(article.url);
    } else {
      console.log(`[${article.title}] 保存失败`);
    }
    
    await br.close();
    return pid;
    
  } catch(e) { 
    console.log(`[${article.title}] 错误: ${e.message}`); 
    await br.close(); 
    return null; 
  }
}

async function setCoverApi(postId, coverUrl) {
  return new Promise((resolve) => {
    const u = new URL('/apis/content.halo.run/v1alpha1/posts/' + postId, HALO_URL);
    const data = JSON.stringify([{op:'replace',path:'/spec/cover',value:coverUrl}]);
    const req = https.request({
      hostname: u.hostname, port: 443, path: u.pathname, method: 'PATCH',
      headers: { 'Content-Type': 'application/json-patch+json', 'Authorization': `Bearer ${HALO_TOKEN}`, 'Content-Length': Buffer.byteLength(data) }
    }, res => { let b = ''; res.on('data', c => b+=c); res.on('end', () => resolve(b)); });
    req.on('error', () => resolve(null)); 
    req.write(data); req.end();
  });
}

async function setCategoryAndTagsApi(postId) {
  const categoryId = await getCategoryId('文章');
  const tagId = await getTagId('资源共享');
  
  if (!categoryId && !tagId) return;
  
  const categories = categoryId ? [{ name: categoryId }] : [];
  const tags = tagId ? [{ name: tagId }] : [];
  
  return new Promise((resolve) => {
    const u = new URL('/apis/content.halo.run/v1alpha1/posts/' + postId, HALO_URL);
    const patches = [];
    
    if (categoryId) patches.push({op: 'replace', path: '/spec/categories', value: categories});
    if (tagId) patches.push({op: 'replace', path: '/spec/tags', value: tags});
    
    if (patches.length === 0) { resolve(null); return; }
    
    const data = JSON.stringify(patches);
    const req = https.request({
      hostname: u.hostname, port: 443, path: u.pathname, method: 'PATCH',
      headers: { 'Content-Type': 'application/json-patch+json', 'Authorization': `Bearer ${HALO_TOKEN}`, 'Content-Length': Buffer.byteLength(data) }
    }, res => { let b = ''; res.on('data', c => b+=c); res.on('end', () => resolve(b)); });
    req.on('error', () => resolve(null)); 
    req.write(data); req.end();
  });
}

async function getCategoryId(categoryName) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'www.redchenk.com', port: 443,
      path: '/apis/api.console.halo.run/v1alpha1/categories',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${HALO_TOKEN}` }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(b);
          if (data.items) {
            for (const cat of data.items) {
              if (cat.spec && cat.spec.displayName === categoryName) {
                resolve(cat.metadata.name);
                return;
              }
            }
          }
          resolve(null);
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function getTagId(tagName) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'www.redchenk.com', port: 443,
      path: '/apis/api.console.halo.run/v1alpha1/tags',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${HALO_TOKEN}` }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(b);
          if (data.items) {
            for (const tag of data.items) {
              if (tag.spec && tag.spec.displayName === tagName) {
                resolve(tag.metadata.name);
                return;
              }
            }
          }
          resolve(null);
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function getList() {
  const br = await chromium.launch({ headless: true, executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const p = await br.newPage();
  try {
    await p.goto(SOURCE_URL + '/', {timeout: 60000});
    await p.waitForLoadState('networkidle');
    await wait(5000);
    
    const arts = await p.evaluate(() => {
      const rs = []; 
      document.querySelectorAll('h2 a, h3 a').forEach(a => {
        if (a.href && a.href.includes('.html') && !a.href.includes('category')) 
          rs.push({t: a.textContent.trim(), l: a.href});
      }); 
      return rs.slice(0, 20);
    });
    
    await br.close(); 
    return arts;
  } catch(e) { 
    console.log('Error getting list:', e.message);
    await br.close(); 
    return []; 
  }
}

async function main() {
  console.log('=== 开始爬取任务 ===', new Date().toLocaleString("zh-CN", {timeZone: "Asia/Shanghai"}));
  
  console.log('检查已发布文章...');
  const publishedUrls = getPublishedArticles();
  const existingTitles = await getExistingTitles();
  console.log(`本地记录: ${publishedUrls.size} 篇, Halo已有: ${existingTitles.size} 篇`);
  
  const arts = await getList();
  console.log(`获取到 ${arts.length} 篇文章`);
  
  if (arts.length === 0) return;
  
  let publishedCount = 0;
  
  for (let i = 0; i < arts.length; i++) {
    const art = arts[i];
    
    if (publishedUrls.has(art.l) || existingTitles.has(art.t)) {
      console.log(`[跳过] 已存在: ${art.t}`);
      continue;
    }
    
    console.log(`\n正在处理: ${art.t}`);
    const d = await getDetail(art.l);
    if (!d || !d.title || !d.cover) { 
      console.log('跳过无效文章'); 
      continue; 
    }
    
    await publish(d);
    await wait(5000);
    publishedCount++;
    
    if (publishedCount >= 1) break;
  }
  
  if (publishedCount === 0) {
    console.log('\n没有新文章需要发布！');
  } else {
    console.log(`\n=== 任务完成，发布了 ${publishedCount} 篇新文章 ===`);
  }
  process.exit(0);
}

main();
