const https = require('https');
const http = require('http');
const parseUrl = require('url').parse;

const request = (method = 'GET', urlString, postData) => {
  const url = parseUrl(urlString);
  const protocolLib = url.protocol == 'https:' ? https : http;
  const params = {
    method: method,
    host: url.host,
    port: url.port || url.protocol == 'https:' ? 443 : 80,
    path: url.path || '/'
  };

  return new Promise(function(resolve, reject) {

    req = protocolLib.get(params, (res) => {
      let data = '';

      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error('statusCode=' + res.statusCode));
      }

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', chunk => {
        try {
          const json = JSON.parse(data);
          resolve(json);

        } catch (err) {
          reject(err)
        }
      });
    })

    req.on('error', err => {
      reject(err)
    })

    if (postData) {
      req.write(postdata);
    }

    req.end();
  })
}

module.exports = request;
