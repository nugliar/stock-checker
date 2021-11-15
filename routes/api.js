'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const request = require('../request.js');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const stockSchema = mongoose.Schema({
  stock: String,
  ips: [{type: String}]
})

const StockModel = mongoose.model('Ip', stockSchema);

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res, next) {
      const reqIp = req.ip;
      const reqLike = req.query.like === 'true' ? true : false;
      let reqStocks = req.query.stock;
      let reqIpHash;
      let stockData;

      if (!reqStocks) {
        return res.send('Required field(s) missing')
      }
      if (!Array.isArray(reqStocks)) {
        reqStocks = [ reqStocks ];
      } else {
        reqStocks = reqStocks.slice(0, 2);
      }

      Promise.all(reqStocks.map(stock => {

        const apiUrl = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock`;
        const url = `${apiUrl}/${stock}/quote`;

        return request('GET', url).then(data => {
          stockData = data;
          return StockModel.findOne({ stock: stock }).exec();

        }).then(doc => {

          let ipHashes = doc ? doc.ips : [];

          if (reqLike && !ipHashes.some(hash => bcrypt.compare(reqIp, hash))) {
            reqIpHash = bcrypt.hashSync(reqIp, 5);
            ipHashes.push(reqIpHash);
          }

          return new Promise((resolve, reject) => {
            let query = StockModel.findOneAndUpdate(
              { stock: stock },
              { stock: stock, ips: ipHashes },
              { upsert: true }
            );
            query.exec((err, doc) => {
              if (err) {
                reject(err);
              }
              resolve({
                stock: doc ? doc.stock : stock,
                price: stockData.latestPrice,
                likes: doc ? doc.ips.length : 0
              });
            });
          });
        }).catch(err => {
          console.log(err.message.text);
          resolve({});
        })

      })).then(docs => {

        if (docs.length > 1) {
          let likes1 = docs[0].likes || 0;
          let likes2 = docs[1].likes || 0;
          let relLikes = likes2 - likes1;

          res.json({
            stockData: docs.map(doc => {
              relLikes = -relLikes;
              return {
                stock: doc.stock,
                price: doc.price,
                rel_likes: relLikes
              }
            })
          })

        } else {
          res.json({
            stockData: docs[0]
          })
        }

      }).catch(err => {
        return next(err);
      });
    })
};
