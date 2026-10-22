const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname,'..');
  fs.mkdirSync(path.join(root,'tmp','pdfs'),{recursive:true});
  fs.mkdirSync(path.join(root,'docs'),{recursive:true});
  const browser = await chromium.launch({
    ...(process.env.CHROME_EXECUTABLE_PATH ? {executablePath: process.env.CHROME_EXECUTABLE_PATH} : {}),
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });
  const results = [];
  const selected=process.argv.slice(2);
  for (const stem of (selected.length?selected:['proposal'])) {
    const page = await browser.newPage({viewport:{width:1120,height:1400},deviceScaleFactor:1});
    await page.goto(pathToFileURL(path.join(root, 'docs', stem + '.html')).href);
    await page.emulateMedia({media:'print'});
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => Array.from(document.querySelectorAll('.page')).map((el, i) => {
      const box = el.getBoundingClientRect();
      const main = el.querySelector('main').getBoundingClientRect();
      const footer = el.querySelector('footer').getBoundingClientRect();
      const overflow = Array.from(el.querySelectorAll('main *')).filter(e => {
        const r=e.getBoundingClientRect();
        return r.right > box.right-24 || r.left < box.left+24;
      }).map(e=>({tag:e.tagName,text:e.textContent.slice(0,50)}));
      return {page:i+1, gapToFooter:Math.round(footer.top-main.bottom),mainHeight:Math.round(main.height),horizontalOverflow:overflow};
    }));
    for (let i=0;i<4;i++) {
      await page.locator('.page').nth(i).screenshot({path:path.join(root,'tmp','pdfs',`${stem}_${i+1}.png`)});
    }
    await page.pdf({path:path.join(root,'docs',`${stem}.pdf`),format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
    results.push({stem,metrics});
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(root,'tmp','pdfs','layout_metrics.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
