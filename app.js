const app = require('express')();
const request = require('request');
const cors = require('./middleware/cors');

let $request = request.defaults({});
if (process.env.http_proxy) {
  $request = request.defaults({ proxy: process.env.http_proxy });
}

module.exports = (config) => {
  const { proxyApiUrl, proxi3Config } = config;

  app.use(cors());

  app.use('*', (req, res, next) => {
    const originalOrigin = req.headers.origin;
    const headers = Object.assign(req.headers, proxi3Config.headers);

    Object.keys(headers).forEach((header) => {
      if (!headers[header]) delete headers[header];
    });

    console.log(`[${(new Date()).toISOString()}] [${req.method}] ${proxyApiUrl}${req.originalUrl}`);

    req.pipe($request({
      url: `${proxyApiUrl}${req.originalUrl}`,
      headers
    }))
    .on('response', (response) => {
      const headers = response.headers;
      headers['Origin'] = originalOrigin;
      headers['Access-Control-Allow-Origin'] = originalOrigin;
      res.writeHead(response.statusCode, headers);
    }).pipe(res);
  });

  return app;
};
