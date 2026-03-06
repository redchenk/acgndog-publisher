# ACGNDOG Publisher

Crawl articles (comics, light novels) from [acgndog.com](https://www.acgndog.com) and publish to Halo blog.

## Features

- Automatically crawl latest articles from acgndog.com
- **Auto deduplication**: Check local records and existing Halo posts to avoid duplicates
- Extract title, author, description, cover image
- Format article content
- Publish as Halo draft posts
- Auto-set cover image
- Publish only 1 new article per run

## Usage

```bash
# Install dependencies
npm install playwright

# Run script
cd acgndog-publisher
NODE_PATH=/usr/local/lib/node_modules node publish.js
```

## Configuration

Pre-configured in script:
- HALO_URL: https://www.redchenk.com  
- Login: redchenk / @Aa620880123

## Deduplication

Script checks two sources to avoid duplicates:
1. **Local records** (`published.json`): Stores URLs of published articles
2. **Halo API**: Fetches all existing article titles from Halo blog

On first run, it syncs existing article titles from Halo, then only publishes new articles.

## Output

- Max 1 new draft article per run
- Format: Title → Author → Description → Content → Source Link
- Cover image auto-set

## Requirements

- Node.js
- Playwright
- Chrome/Chromium browser
