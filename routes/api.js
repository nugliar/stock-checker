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
      if (reqLike) {
        reqIpHash = bcrypt.hashSync(reqIp, 10);
      }

      Promise.all(reqStocks.map(stock => {

        const apiUrl = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock`;
        const url = `${apiUrl}/${stock}/quote`;

        return request('GET', url).then(data => {
          stockData = data;
          return StockModel.findOne({ stock: stock }).exec();

        }).then(doc => {

          const ipHashes = doc ? doc.ips : [];
          const update = {
            stock: stock,
            ips: reqLike ? ipHashes.concat(reqIpHash) : ipHashes
          };

          return new Promise((resolve, reject) => {
            let query = StockModel.findOneAndUpdate(
              { stock: stock },
              update,
              { upsert: true, returnDocument: 'after' }
            );
            query.exec((err, doc) => {
              if (err) { reject(err) }
              doc.price = stockData.latestPrice;
              resolve(doc);
            });
          });
        })

      })).then(docs => {

        if (docs.length > 1) {
          let t = docs[0].likes;
          docs[0].likes -= docs[1].likes;
          docs[1].likes -= t;

          res.json(docs.map(doc => ({
            stockData: {
              stock: doc.stock,
              price: doc.price,
              likes: doc.ips ? doc.ips.length : 0
            }})
          ));

        } else {
          res.json({
            stockData: {
              stock: docs[0].stock,
              price: docs[0].latestPrice,
              likes: docs[0].ips ? docs[0].ips.length : 0
            }
          })
        }

      }).catch(err => {

        console.error(err.message);
        return next(err);
      });
    })
};
