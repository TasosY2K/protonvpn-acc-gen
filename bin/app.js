#!/usr/bin/env node
const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const chalk = require('chalk');
const boxen = require('boxen');
const Table = require('cli-table');

const func = require('./functions.js');

const mailsac_url = 'https://mailsac.com';
const proton_url = 'https://account.protonvpn.com/signup';

let proxy_url;

let options = {
  confirmation:{
    type:"confirm",
    name:"confirmation",
    message:"Generate a new ProtonVPN account?"
  }
}

const {version} = require('./../package.json');
console.log(boxen('ProtonVPN Generator ' + version, {padding: 1, margin: 1, borderStyle: 'double'}));
console.log(chalk.bold('Coded by ' + chalk.magenta('leandev')));
console.log(chalk.bold('More info: ' + chalk.cyan('http://l34nd3v.com')));
console.log(chalk.bold(chalk.red('This is an unofficial tool and is not affiliated with Proton Technologies AG\n')));

async function createAccount() {

  let user = func.createRandomString(12);
  let pasw = func.createRandomString(32);

  await inquirer.prompt(options.confirmation).then(async a => {
    if (!a.confirmation) {
      await process.exit();
    }
  });

  const browser = await puppeteer.launch();

  await console.log(chalk.bold(chalk.cyan('i ') + 'Generating your account...'));

  let page_mailsac = await browser.newPage();

  await page_mailsac.goto(mailsac_url);

  await page_mailsac.waitForSelector('body > div > div.container-fluid > div:nth-child(1) > div.col-sm-5.align-center > div > input');
  await page_mailsac.type('body > div > div.container-fluid > div:nth-child(1) > div.col-sm-5.align-center > div > input', user);

  await page_mailsac.click('body > div > div.container-fluid > div:nth-child(1) > div.col-sm-5.align-center > div > button');

  let mail = user + '@mailsac.com';

  const page_proton = await browser.newPage();
  await page_proton.goto(proton_url);

  await page_proton.waitForSelector('body > div.app-root > main > main > div > div:nth-child(5) > div:nth-child(1) > div.flex-item-fluid-auto.pt1.pb1.flex.flex-column > button').then(() => {}).catch(e => {
    console.log(chalk.bold(chalk.red('X ') + 'Selector error'));
    browser.close();
  });

  await page_proton.click('body > div.app-root > main > main > div > div:nth-child(5) > div:nth-child(1) > div.flex-item-fluid-auto.pt1.pb1.flex.flex-column > button');

  await page_proton.type('#username', user);
  await page_proton.type('#password', pasw);
  await page_proton.type('#passwordConfirmation', pasw);
  await page_proton.type('#email', mail);

  await page_proton.click('body > div.app-root > main > main > div > div.pt2.mb2 > div > div:nth-child(1) > form > div:nth-child(3) > div > button');

  await page_proton.waitForSelector('body > div.app-root > main > main > div > div.pt2.mb2 > div > div.w100 > div:nth-child(2) > div > div > div:nth-child(2) > form > div:nth-child(2) > button').catch(e => {
    console.log(chalk.bold(chalk.red('X ') + 'Selector error'));
    browser.close();
  });

  await page_proton.click('body > div.app-root > main > main > div > div.pt2.mb2 > div > div.w100 > div:nth-child(2) > div > div > div:nth-child(2) > form > div:nth-child(2) > button');

  await page_mailsac.bringToFront();

  setTimeout(async () => {await page_mailsac.goto(mailsac_url + '/inbox/' + mail)}, 20000);

  await page_mailsac.waitForSelector('body > div > div.container-fluid > div.ng-scope > div > div > div > table > tbody > tr.clickable.ng-scope').catch(e => {
    console.log(chalk.bold(chalk.red('X ') + 'Selector error'));
    browser.close();
  });

  await page_mailsac.click('body > div > div.container-fluid > div.ng-scope > div > div > div > table > tbody > tr.clickable.ng-scope')

  const auth_code = await page_mailsac.evaluate(el => el.innerHTML, await page_mailsac.$('body > div > div.container-fluid > div.ng-scope > div > div > div > table > tbody > tr.clickable.ng-scope > td.active.not-clickable > div.ng-binding.ng-scope > p > code'));

  await page_proton.bringToFront();

  await page_proton.type('#code', auth_code);
  await page_proton.click('body > div.app-root > main > main > div > div.pt2.mb2 > div > div.w100 > div:nth-child(2) > form > div > div > div:nth-child(4) > button')

  let table = await new Table({
  head: [chalk.green('Username'), chalk.green('Password'), chalk.green('Email')],
  chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
         , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
         , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
         , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
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
