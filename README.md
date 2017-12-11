proxi3
======
A command-line tool to start a proxy for your server, redirecting all traffic from localhost:3000/\*\*/\* to your-server.com/\*\*/\* for development purposes.
Before request the server, request headers can be overrided by *proxi3.config.json*, after the server is requested, the response headers: **Origin** and **Access-Control-Allow-Origin** are restaured to original values, this trick prevent browser to fire the *Allow-Control-Allow-Origin same origin policy error*.

## Install
```shell
npm install -g proxi3
```

## Config
A *proxi3.config.json* can be created in root project and proxi3 will read de config and starts with this configuration.

- **headers**: Overrides the original request headers, to pass to server request.
- **hooks**: Overrides the original request, with custom response and status code.

### proxi3.config.json example:
```json
{
  "headers": {
    "host": false,
    "origin": "https://MY-ORIGIN/",
    "user-agent": "MY-USER-AGENT"
  },
  "hooks": [
    {
      "method": "post",
      "path": "/\\D{2}/user.*",
      "response": {
        "status": 500,
        "data": ""
      }
    }
  ]
}
```

## Usage
```shell
proxi3 [options] <proxy_api>
```

#### Usage example:
```shell
proxi3 http://example.com/ --config ~/proxi3.config.json
```

### Options:
```
  -V, --version                  output the version number
  -p, --port [port]              specify proxi3 port (default: 3000)
  -P, --http_proxy [http_proxy]  specify proxy
  -H, --host [host]              specify proxi3 host (default: 0.0.0.0)
  -c, --config <config>          specify proxi3.config.json path
  -h, --help                     output usage information
```
