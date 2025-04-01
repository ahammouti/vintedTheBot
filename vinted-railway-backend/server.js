
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.get('/search', async (req, res) => {
  const { query, maxPrice = 50 } = req.query;
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const url = `https://www.vinted.fr/vetements?search_text=${encodeURIComponent(query)}&price_to=${maxPrice}`;

  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);

  const results = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll("div.feed-grid__item"));
    return items.slice(0, 10).map(item => {
      const title = item.querySelector("h3")?.innerText || "";
      const price = item.querySelector(".price")?.innerText || "";
      const href = item.querySelector("a")?.getAttribute("href") || "";
      return {
        title,
        price,
        link: 'https://www.vinted.fr' + href
      };
    });
  });

  await browser.close();
  res.json(results);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
