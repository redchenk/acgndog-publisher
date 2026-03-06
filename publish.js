#!/usr/bin/env node

const { chromium } = require('playwright');
const https = require('https');

const HALO_URL = 'https://www.redchenk.com';
const HALO_TOKEN = 'pat_eyJraWQiOiJFMDIxelh2WDlCS2o1RkpMLUh2TTVtc21DS1pLQ0psaV9QeEdxQlBZaDRBIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjkwOTAiLCJzdWIiOiJ1cHBlciIsImlhdCI6MTc3Mjc2NjAzNCwianRpIjoiZjM5MzEyMDEtYzc4Ni04MzMwLTQ4ZDAtNjBhZTU2NDY0YTQyIiwicGF0X25hbWUiOiJwYXQtOThycWRkc3IifQ.oTOR3QpWx6j0MFQ5gsTVW18z15CNTNTGwIxOTu3T45GQ6VYkjn96IdUGiW9JFzMq080k31kW0jXycfzY3LUD1AnSfwmhmuDDq2pIa0gkCMJtr_zvWpcJG6NyJpDpdbeqdtWggR1JdYz_JSNwvCnlu_M18CVoj1v4rE57lUpdCakYXy3EVkPQk3oaSMKnmXl0IuHJN2YO-fi5lVsyqJNqgbiBK37T8ewj0UcIxSSIeB029BEl31Q1ThfoADEuf1AzXG_Ve3WhJ8V7g5F_oT9fUSDJg2zBFDnm9oaZyoOpIpid2CVYMDRBqCNxZghNijiFUtxZyLPvSSH3hIhN6VaiCyuoU1wvdjCTVo6LeCA4cEn08xvydUR1p_rg6wyiO8J7h4onBn-UxoxVaHKSuHPI-r4885jzhA58ZRQaV29ByMdoIYzjAESnXUz2KgxzkhQbhrE5qFEhEF0vJkqR0yIC0SsGoV15yiXlmtR5-0vISFpDkVMeVbWz3CFQgG5ca_5X7JwjIlvTUK6LoBaivv5S-WL9SCi-JzfXKxdyYbwdAaM9NRNATxm_YrcK2RRkMVltnYK2tRm7ZNsO1dqelDCUSTmEGFnYnu7BFZHUtp2mQcIubbJ6XXiH5xSmWyAHGoGizTRyNQPkxlCjey5QTovGqjrsb-l-dL_UsAwm1Tv3aDY';
const SOURCE_URL = 'https://www.acgndog.com';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// 获取文章详情
async function getDetail(url) {
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
      
      const description = paragraphs.slice(0, 2).join(' ');
      
      return { title, cover, author, description, paragraphs };
    });
    
    article.url = url;
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
    
    // 编辑器
    await p.click('[contenteditable="true"]'); await wait(1000);
    
    // 内容
    let content = article.title + '\n\n';
    if (article.author) content += article.author + '\n\n';
    content += '---\n\n';
    content += article.description + '\n\n';
    content += '---\n\n';
    content += '原文链接：' + article.url;
    
    await p.keyboard.type(content, {delay: 10});
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

// 获取文章列表
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
      return rs.slice(0, 10);
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
  console.log('=== 开始爬取任务 ===', new Date().toISOString());
  const arts = await getList();
  console.log(`获取到 ${arts.length} 篇文章`);
  
  if (arts.length === 0) return;
  
  for (let i = 0; i < Math.min(3, arts.length); i++) {
    console.log(`\n正在处理: ${arts[i].t}`);
    const d = await getDetail(arts[i].l);
    if (!d || !d.title || !d.cover) { 
      console.log('跳过无效文章'); 
      continue; 
    }
    await publish(d);
    await wait(5000);
  }
  console.log('\n=== 任务完成 ===');
  process.exit(0);
}

main();
