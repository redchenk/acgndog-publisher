# ACGNDOG Publisher

Crawl articles (comics, light novels) from [acgndog.com](https://www.acgndog.com) and publish to Halo blog.

## Features

- Automatically crawl latest articles from acgndog.com
- Extract title, author, description, cover image
- Format article content
- Publish as Halo draft posts
- Auto-set cover image

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

## Output

- Publish 3 draft articles each run
- Format: Title → Author → Description → Content → Source Link
- Cover image auto-set

## Requirements

- Node.js
- Playwright
- Chrome/Chromium browser
