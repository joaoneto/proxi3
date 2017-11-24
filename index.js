#! /usr/bin/env node

const cwd = process.cwd();
const path = require('path');
const app = require('express')();
const request = require('request');
const { spawn } = require('child_process');
const program = require('commander');
const package = require('./package');

let proxi3Config = {};
try {
  proxi3Config = require(path.resolve(cwd, 'proxi3.config'));
} catch (e) {
}

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
  .option('-p, --port [port]', 'Specify proxi3 port', 3000)
  .option('-H, --host [host]', 'Specify proxi3 host', '0.0.0.0')
  .parse(process.argv);

if (typeof proxyApi === 'undefined') {
  console.log('  No <proxy_api> given');
  program.help();
  process.exit(1);
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  next();
});

app.use('*', (req, res, next) => {
  const headers = Object.assign(req.headers, proxi3Config.headers);
  Object.keys(headers).forEach((header) => {
    if (!headers[header]) delete headers[header];
  });

  console.log(headers)
  console.log(`[${(new Date()).toISOString()}] [${req.method}] ${proxyApi}${req.originalUrl}`);

  req.pipe($request({
    url: `${proxyApi}${req.originalUrl}`,
    headers
  })).pipe(res);
});

app.listen(program.port, program.host, () => {
  console.log(`runing proxi3 on http://${program.host}:${program.port}`);
  console.log(`proxing: ${proxyApi}`);
  console.log("                     _ _____ ");
  console.log(" _ __  _ __ _____  _(_)___ / ");
  console.log("| '_ \\| '__/ _ \\ \\/ / | |_ \\ ");
  console.log("| |_) | | | (_) >  <| |___) |");
  console.log("| .__/|_|  \\___/_/\\_\\_|____/ ");
  console.log("|_|");
})
