const app = require('express')();
const request = require('request');
const cors = require('./middleware/cors');
const hooks = require('./middleware/hooks');
const logging = require('./logging');
const zlib = require('zlib');

const handleResponse = (error, _response, responseBody, requestBody) => {
  if (error) {
    return logging.emit('error', error);
  }

  const responseJson = _response.toJSON();
  const { request, ...response } = responseJson;

  logging.emit('logging', {
    request: {
      body: requestBody,
      url: request.uri.href,
      pathname: request.uri.pathname,
      query: request.query,
      headers: request.headers,
      method: request.method,
    },
    response: {
      statusCode: response.statusCode,
      body: responseBody,
      headers: response.headers,
    }
  });
};

module.exports = (config) => {
  const { proxyApiUrl, proxi3Config } = config;

  let $request = request.defaults({});
  if (proxi3Config.http_proxy) {
    $request = request.defaults({ proxy: proxi3Config.http_proxy });
  }

  app.use(cors());
  app.use(hooks(proxi3Config.hooks));

  app.use('*', (req, res, next) => {
    const originalOrigin = req.headers.origin;
    const headers = Object.assign(req.headers, proxi3Config.headers);

    Object.keys(headers).forEach((header) => {
      if (!headers[header]) delete headers[header];
    });

    console.log(`[${(new Date()).toISOString()}] [${req.method}] ${proxyApiUrl}${req.originalUrl}`);

    // promisefy this
    let requestBody = [];
    req.on('data', (chunk) => {
      requestBody.push(chunk);
    })
    .on('end', () => {
      requestBody = Buffer.concat(requestBody).toString();
    });

    req.pipe($request({
      encoding: null,
      url: `${proxyApiUrl}${req.originalUrl}`,
      headers
    }))
    .on('response', (response) => {
      const headers = response.headers || {};
      if (originalOrigin) {
        headers['origin'] = originalOrigin;
        headers['access-control-allow-origin'] = originalOrigin;
      }

      res.writeHead(response.statusCode, headers);

      let responseBody = [];
      let output;
      if (response.headers['content-encoding'] == 'gzip') {
        const gzip = zlib.createGunzip();
        response.pipe(gzip);
        output = gzip;
      } else {
        output = response;
      }

      output.on('data', (chunk) => {
        responseBody.push(chunk);
      })

      output.on('end', () => {
        responseBody = Buffer.concat(responseBody).toString();
        handleResponse(false, response, responseBody, requestBody);
      });
    }).pipe(res);
  });

  return app;
};
