/* 
This node.js script uses Selenium to extract data from the protopie connect web interface
running at http://localhost:9981/ when protopie connect is open and connected to a pie.
It prints new JSON data to the console whenever it changes.
Make sure to have selenium-webdriver and chromedriver installed via npm.
Usage:
  node test.js
*/

// IMPORTS
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// MAIN ASYNC FUNCTION
// RUNS IMMEDIATELY - prints ONLY new JSON data
(async () => {
  const CONFIG = {
    URL: 'http://localhost:9981/',
    POLL_INTERVAL: 50, // 50 ms is the max Selenium can handle reliably
    CHROME_ARGS: [
      '--disable-web-security', '--no-sandbox', '--disable-gpu', 
      '--disable-dev-shm-usage', '--disable-logging', '--silent', 
      '--log-level=3', '--disable-extensions', '--disable-background-timer-throttling'
    ]
  };

   // FUNCTION to compare two objects
  function deepEqual(obj1, obj2) {
    return JSON.stringify(obj1, Object.keys(obj1).sort()) === 
           JSON.stringify(obj2, Object.keys(obj2).sort());
  }

  // FUNCTION to find the data table in the page
  async function findTable(driver) {
    const selectors = [
      '//table//tbody', '//main//table', '//table',
      '//div[contains(@class,"table")]//table', '//*[contains(@class,"table")]'
    ];
    for (const selector of selectors) {
      try {
        return await driver.findElement(By.xpath(selector));
      } catch(e) {}
    }
    return null;
  }

  // FUNCTION to extract data from the first row of the table
  async function extractRowData(tableBody) {
    const rows = await tableBody.findElements(By.xpath('./tr'));
    if (rows.length === 0) return null;
    
    const cells = await rows[0].findElements(By.xpath('./td | ./th'));
    if (cells.length < 3) return null;
    
    const [time, message, valueRaw, pieRaw, sourceRaw] = await Promise.all([
      cells[0]?.getText?.() || '',
      cells[1]?.getText?.() || '',
      cells[2]?.getText?.() || '',
      cells[3]?.getText?.() || '',
      cells[4]?.getText?.() || ''
    ]);
    
    const timeTrim = time.trim();
    if (!timeTrim.match(/\d{2}:\d{2}:\d{2}:\d{3}/)) return null;
    
    // RETURN structured data
    return {
      time: timeTrim,
      message: message.trim(),
      value: valueRaw.replace(/^["']|["']$/g, '').trim(),
      pie: pieRaw.trim(),
      source: sourceRaw.trim()
    };
  }

  // SILENT CHROME SETUP
  const options = new chrome.Options()
    .addArguments(CONFIG.CHROME_ARGS)
    .setUserPreferences({ 'loggingPrefs': { browser: 'OFF' } })
    .excludeSwitches(['enable-logging']);

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.get(CONFIG.URL);
  await driver.wait(until.titleContains('ProtoPie'), 15000);
  
  // VARIABLES for monitoring changes
  let lastEntry = null;
  let hasSeenData = false;
  let latestDataCache = null;

  // AUTO-START MONITORING
  // POLLING LOOP (50ms)
  const poll = setInterval(async () => {
    try {
      // Find the table body containing data rows
      const tableBody = await findTable(driver);
      if (!tableBody) return;
      
      // store the data currentEntry is the latest data row in JSON format
      const currentEntry = await extractRowData(tableBody);
      if (!currentEntry) return;
      
      // Avoid processing identical data repeatedly
      latestDataCache = { ...currentEntry };
      
      // On first data seen, or if data has changed, print it 
      if (!hasSeenData) {
        hasSeenData = true;
        lastEntry = { ...currentEntry };
        console.log(JSON.stringify(currentEntry, null, 2));
        console.log('');
        return;
      }
      
      // Compare with last entry and print if different
      if (!deepEqual(currentEntry, lastEntry)) {
        lastEntry = { ...currentEntry };
        console.log(JSON.stringify(currentEntry, null, 2));
        console.log('');
      }
    } catch(e) {}
  }, CONFIG.POLL_INTERVAL);

  // CLEAN SHUTDOWN
  process.on('SIGINT', async () => {
    clearInterval(poll);
    await driver.quit();
    process.exit(0);
  });

  // READY - monitoring live
  console.log('🚀 LINK WITH PROTOPIE CONNECT ESTABLISHED ... (Ctrl+C to stop)');
})();
