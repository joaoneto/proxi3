proxi3
======
A command-line tool to start a proxy for your server, redirecting all traffic from localhost:3000/\*\*/\* to your-server.com/\*\*/\* for development purposes.

## Install
```shell
npm install -g proxi3
```

## Config
A *proxi3.config.json* can be created in root project and proxi3 will read de config and starts with this configuration.

### proxi3.config.json example:
```json
{
  "headers": {
    "host": false,
    "origin": "https://MY-ORIGIN/",
    "user-agent": "MY-USER-AGENT"
  }
}
```

## Usage
```shell
proxi3 [options] <proxy_api>
```

### Options:
```
  -V, --version      output the version number
  -p, --port [port]  Specify proxi3 port (default: 3000)
  -H, --host [host]  Specify proxi3 host (default: 0.0.0.0)
  -h, --help         output usage information
```