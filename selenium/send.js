/**
 * ProtoPie Connect Fast Sender
 * ============================
 * High-speed data sender for ProtoPie Connect at http://localhost:9981/.
 * Designed for rapid and synchronized value transmission via Selenium WebDriver.
 *
 * Description:
 * - Sends data as fast as possible with safe DOM synchronization.
 * - Waits for confirmation that the new value has been applied before continuing.

 * Usage:
 *   Replace getValue() with data input logic (e.g., serialport read).
 */

// IMPORTS (ensure selenium-webdriver and chromedriver are installed)
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// PROTOPIE SENDER CLASS
class ProtoPieSender {
  constructor(config = {}) {
    this.config = {
      url: config.url || 'http://localhost:9981/',
      message: config.message || 'test', // Default message text
      ...config
    };

    this.driver = null;
    this.messageInput = null;
    this.valueInput = null;
    this.running = false;
    this.sendCount = 0;
  }

  // Returns the message string (can be customized)
  getMessage() {
    return this.config.message;
  }

  // Returns the data value (replace with real data source as needed)
  getValue() {
    return Math.floor(Math.random() * 100) + 1;
  }

  // FUNCTION TO INITIALIZE WEBDRIVER
  async init() {
    const options = new chrome.Options()
      .addArguments([
        '--disable-web-security',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-logging',
        '--silent',
        '--log-level=3'
      ])
      .excludeSwitches(['enable-logging']);

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }

  // FUNCTION TO SETUP PAGE AND ELEMENTS
  async setup() {
    await this.driver.get(this.config.url);
    await this.driver.wait(until.titleContains('ProtoPie'), 10000);
    await this.driver.wait(until.elementLocated(By.css('.message-sender')), 5000);

    this.messageInput = await this.driver.findElement(By.xpath(
      '//div[contains(@class, "message-sender")]//input[contains(@placeholder, "Message")]'
    ));
    this.valueInput = await this.driver.findElement(By.xpath(
      '//div[contains(@class, "message-sender")]//input[contains(@placeholder, "Value")]'
    ));

    // Ready message
    console.log('🔗 Connected with Protopie Connect Server - Ready to send data ...');
    console.log('Press Ctrl+C to stop.');
  }

  // FUNCTION TO CLEAR INPUT FIELD
  async clearField(input) {
    await input.click();
    await input.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.DELETE);
  }

  // FUNCTION TO SEND A SINGLE MESSAGE-VALUE PAIR
  async sendOnce(message, value) {
    await this.clearField(this.messageInput);
    await this.messageInput.sendKeys(message);
    await this.clearField(this.valueInput);
    await this.valueInput.sendKeys(value.toString());
    await this.valueInput.sendKeys(Key.ENTER);

    // Confirm both fields are updated (safe synchronization)
    await this.driver.wait(async () => {
      const msgText = await this.messageInput.getAttribute('value');
      const valText = await this.valueInput.getAttribute('value');
      return msgText === message && valText === value.toString();
    }, 1000);

    this.sendCount++;
    console.log(`📤 [${this.sendCount}] Sent "${message}" = ${value}`);
  }

  // MAIN SENDING LOOP
  async sendLoop() {
    this.running = true;
    while (this.running) {
      try {
        const message = this.getMessage();
        const value = this.getValue();
        await this.sendOnce(message, value);
      } catch (err) {
        console.error('Send error:', err.message);
      }
    }
  }

  // FUNCTION TO STOP SENDER
  async stop() {
    this.running = false;
    if (this.driver) await this.driver.quit();
    console.log(`Stopped. Sent ${this.sendCount} messages.`);
  }

  // MAIN RUN FUNCTION
  // Initialize, setup, and start sending messages
  async run() {
    try {
      await this.init();
      await this.setup();
      await this.sendLoop();

      // Handle Ctrl+C gracefully
      process.on('SIGINT', () => this.stop().then(() => process.exit(0)));
    } catch (error) {
      console.error('Failed:', error.message);
      await this.stop();
    }
  }
}

// EXPORT MODULE
module.exports = ProtoPieSender;

// Run directly if executed as a script
if (require.main === module) {
  const sender = new ProtoPieSender({ message: 'speed' });
  sender.run();
}
