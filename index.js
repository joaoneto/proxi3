#! /usr/bin/env node

const cwd = process.cwd();
const path = require('path');
const app = require('express')();
const request = require('request');
const { spawn } = require('child_process');
const program = require('commander');
const package = require('./package');

let $request = request.defaults({});
if (process.env.http_proxy) {
  $request = request.defaults({ proxy: process.env.http_proxy });
}

let proxyApi;

program
  .version(package.version)
  .arguments('<proxy_api>')
  .action((argProxyApi) => {
    proxyApi = argProxyApi.replace(/\/$/, '');
  })
  .option('-p, --port [port]', 'specify proxi3 port', 3000)
  .option('-H, --host [host]', 'specify proxi3 host', '0.0.0.0')
  .option('-c, --config <config>', 'specify proxi3.config.json path')
  .parse(process.argv);

if (typeof proxyApi === 'undefined') {
  console.log('  No <proxy_api> given');
  program.help();
  process.exit(1);
}


const proxi3ConfigPath = program.config ? program.config : path.resolve(cwd, 'proxi3.config');
let proxi3Config = {};
try {
  proxi3Config = require(proxi3ConfigPath);
} catch (e) {
  if (program.config) {
    console.error(`  proxi3 config file not found at: ${proxi3ConfigPath}`);
    process.exit(1);
  }
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  next();
});

app.use('*', (req, res, next) => {
  const originalOrigin = req.headers.origin;
  const headers = Object.assign(req.headers, proxi3Config.headers);

  Object.keys(headers).forEach((header) => {
    if (!headers[header]) delete headers[header];
  });

  console.log(`[${(new Date()).toISOString()}] [${req.method}] ${proxyApi}${req.originalUrl}`);

  req.pipe($request({
    url: `${proxyApi}${req.originalUrl}`,
    headers
  }))
  .on('response', (response) => {
    const headers = response.headers;
    headers['Origin'] = originalOrigin;
    headers['Access-Control-Allow-Origin'] = originalOrigin;
    res.writeHead(response.statusCode, headers);
  }).pipe(res);
});

app.listen(program.port, program.host, () => {
  console.log(`runing proxi3 on http://${program.host}:${program.port}`);
  console.log(`proxing: ${proxyApi}`);
  console.log(`trying to use: ${proxi3ConfigPath}`);
  console.log('');
  console.log("                     _ _____ ");
  console.log(" _ __  _ __ _____  _(_)___ / ");
  console.log("| '_ \\| '__/ _ \\ \\/ / | |_ \\ ");
  console.log("| |_) | | | (_) >  <| |___) |");
  console.log("| .__/|_|  \\___/_/\\_\\_|____/ ");
  console.log("|_|");
})
