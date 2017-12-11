#! /usr/bin/env node

const cwd = process.cwd();
const fs = require('fs');
const path = require('path');
const program = require('commander');
const package = require('./package');

let proxyApiUrl;

program
  .version(package.version)
  .arguments('<proxy_api>')
  .action((argProxyApiUrl) => {
    proxyApiUrl = argProxyApiUrl.replace(/\/$/, '');
  })
  .option('-p, --port [port]', 'specify proxi3 port', 3000)
  .option('-P, --http_proxy [http_proxy]', 'specify proxy', process.env.http_proxy)
  .option('-H, --host [host]', 'specify proxi3 host', '0.0.0.0')
  .option('-c, --config <config>', 'specify proxi3.config.json path')
  .parse(process.argv);

if (typeof proxyApiUrl === 'undefined') {
  console.log('  No <proxy_api> given');
  program.help();
  process.exit(1);
}

const proxi3ConfigPath = program.config ? program.config : path.resolve(cwd, 'proxi3.config.json');
let proxi3Config = {};

try {
  proxi3Config = JSON.parse(fs.readFileSync(proxi3ConfigPath));
} catch (e) {
  if (program.config) {
    console.error(`  proxi3 reading config file error: ${proxi3ConfigPath}`);
    process.exit(1);
  }
}

if (program.http_proxy) {
  proxi3Config.http_proxy = program.http_proxy;
}

const app = require('./app')({ proxyApiUrl, proxi3Config });
app.listen(program.port, program.host, () => {
  console.log(`runing proxi3 on http://${program.host}:${program.port}`);
  console.log(`proxing: ${proxyApiUrl}`);
  console.log(`trying to use: ${proxi3ConfigPath}`);
  console.log('');
  console.log("                     _ _____ ");
  console.log(" _ __  _ __ _____  _(_)___ / ");
  console.log("| '_ \\| '__/ _ \\ \\/ / | |_ \\ ");
  console.log("| |_) | | | (_) >  <| |___) |");
  console.log("| .__/|_|  \\___/_/\\_\\_|____/ ");
  console.log("|_|");
})
