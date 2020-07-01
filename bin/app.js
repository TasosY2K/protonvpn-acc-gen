#!/usr/bin/env node
const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const chalk = require('chalk');
const boxen = require('boxen');
const Table = require('cli-table');

const guerrillamail_url = 'https://www.guerrillamail.com/en';
const proton_url = 'https://account.protonvpn.com/signup';

let options = {
  confirmation: {
    type: "confirm",
    name: "confirmation",
    message: "Generate a new ProtonVPN account?"
  }
}

const { version } = require('./../package.json');
console.log(boxen('ProtonVPN Generator ' + version, { padding: 1, margin: 1, borderStyle: 'double' }));
console.log(chalk.bold('Coded by ' + chalk.magenta('leandev')));
console.log(chalk.bold('More info: ' + chalk.cyan('http://l34nd3v.com')));
console.log(chalk.bold(chalk.red('This is an unofficial tool and is not affiliated with Proton Technologies AG\n')));

const getAuthCode = () => {
  const all_emails = Array.from(document.querySelector('#email_list').querySelectorAll('tr'))
  for (const email of all_emails) {
    const body = email.querySelector('.email-excerpt').innerText
    if (body.includes('Your Proton verification code is: ')) {
      return body.replace('Your Proton verification code is: ', '')
    }
    else {
      return false
    }
  }
}

const createRandomString = length => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function createAccount() {
  let user = createRandomString(12);
  let pasw = createRandomString(32);

  await inquirer.prompt(options.confirmation).then(async a => {
    if (!a.confirmation) {
      await process.exit();
    }
  });

  const browser = await puppeteer.launch({
    args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process', '--disable-dev-shm-usage']
  });

  await console.log(chalk.bold(chalk.cyan('i ') + 'Generating your account...'));

  const page_guerrillamail = await browser.newPage();

  await page_guerrillamail.goto(guerrillamail_url);
  await page_guerrillamail.click('#use-alias')

  await page_guerrillamail.waitForSelector('#email-widget');
  const mail = await page_guerrillamail.evaluate(() => document.querySelector('#email-widget').innerText);
  const page_proton = await browser.newPage();
  await page_proton.goto(proton_url);

  await page_proton.waitForSelector('body > div.app-root > main > main > div > div:nth-child(5) > div:nth-child(1) > div.flex-item-fluid-auto.pt1.pb1.flex.flex-column > button').then(() => { }).catch(e => {
    console.log(chalk.bold(chalk.red('X ') + 'Selector error'));
    browser.close();
  });

  await page_proton.click('body > div.app-root > main > main > div > div:nth-child(5) > div:nth-child(1) > div.flex-item-fluid-auto.pt1.pb1.flex.flex-column > button');

  const all_iframe_elements = await page_proton.$$('iframe');

  const username_iframe_element = all_iframe_elements[0];
  const username_iframe = await username_iframe_element.contentFrame();
  await username_iframe.waitForSelector('#username');
  const username_element = await username_iframe.$('#username');

  const email_iframe_element = all_iframe_elements[1];
  const email_iframe = await email_iframe_element.contentFrame();
  const email_element = await email_iframe.$('#email');

  await username_element.type(user, { delay: 30 });
  await page_proton.type('#password.pm-field', pasw);
  await page_proton.type('#passwordConfirmation', pasw);
  await email_element.type(mail, { delay: 30 });

  await page_proton.click('body > div > main > main > div > div.pt2.mb2 > div > div:nth-child(1) > form > div:nth-child(5) > div > button');

  await page_proton.waitForSelector('body > div.app-root > main > main > div > div.pt2.mb2 > div > div.w100 > div:nth-child(2) > div > div > div:nth-child(2) > form > div:nth-child(2) > button').catch(e => {
    console.log(chalk.bold(chalk.red('X ') + 'Selector error'));
    browser.close();
  });

  await page_proton.click('body > div.app-root > main > main > div > div.pt2.mb2 > div > div.w100 > div:nth-child(2) > div > div > div:nth-child(2) > form > div:nth-child(2) > button');

  await page_guerrillamail.bringToFront();

  await page_guerrillamail.waitForFunction(getAuthCode)

  const auth_code = await page_guerrillamail.evaluate(getAuthCode)

  await page_proton.bringToFront();

  await page_proton.type('#code', auth_code);
  await page_proton.click('body > div.app-root > main > main > div > div.pt2.mb2 > div > div.w100 > div:nth-child(2) > form > div > div > div:nth-child(4) > button')

  let table = await new Table({
    head: [chalk.green('Username'), chalk.green('Password'), chalk.green('Email')],
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
      , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
      , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
      , 'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });

  await table.push([user, pasw, mail]);

  console.log(chalk.bold(chalk.green('✓ ') + 'Account generated'));
  console.log(table.toString());
  console.log(chalk.bold(chalk.cyan('i ') + 'Verifying account...'));

  setTimeout(async () => {
    await browser.close()
    await console.log(chalk.bold(chalk.green('✓ ') + 'Account verified'));
    await console.log(chalk.bold(chalk.cyan('i ') + 'Exiting...'));
    await process.exit();
  }, 20000);
}

createAccount();
