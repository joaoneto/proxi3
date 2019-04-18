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

const requestBody = (request) => {
  return new Promise((resolve, reject) => {
    let requestBody = [];
    request.on('data', (chunk) => {
      requestBody.push(chunk);
    });
    request.on('error', (error) => {
      handleResponse(error);
    });
    request.on('end', () => {
      requestBody = Buffer.concat(requestBody).toString();
      resolve(requestBody);
    });
  });
};

const responseBody = (response) => {
  return new Promise((resolve, reject) => {
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
    });
    output.on('error', (error) => {
      handleResponse(error);
    });
    output.on('end', () => {
      responseBody = Buffer.concat(responseBody).toString();
      resolve(responseBody);
    });
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

    // concat request body payload stream
    const requestBodyPromise = requestBody(req);

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

      // concat response body payload stream
      const responseBodyPromise = responseBody(response);

      // resolve request and response concat body promises
      Promise.all([
        requestBodyPromise,
        responseBodyPromise
      ])
      .then(([requestBody, responseBody]) => {
        handleResponse(false, response, responseBody, requestBody);
      })
      .catch((error) => {
        handleResponse(error);
      });
    }).pipe(res);
  });

  return app;
};
