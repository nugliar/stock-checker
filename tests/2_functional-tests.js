const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let randomStocks;
  let lastLikes;

  suiteSetup(function() {
    randomStocks = [
      randomString(),
      randomString()
    ];
  })

  test('Viewing one stock: GET request to /api/stock-prices/', function(done) {
    chai
      .request(server)
      .get(`/api/stock-prices/?stock=GOOG`)
      .end((err, res) => {
        const stockData = res.body.stockData;

        assert.equal(res.status, 200);
        assert.isOk(stockData);
        assert.isOk(stockData.stock);
        assert.isFinite(Number(stockData.likes));
        assert.isFinite(Number(stockData.price));
        assert.equal(stockData.stock, 'GOOG');
        done();
      })
  })

  test('Viewing one stock and liking it: GET request to /api/stock-prices/', function(done) {
    chai
      .request(server)
      .get(`/api/stock-prices/?stock=${randomStocks[0]}&like=true`)
      .end((err, res) => {
        const stockData = res.body.stockData;

        assert.equal(res.status, 200);
        assert.isOk(stockData);
        assert.isOk(stockData.stock);
        assert.isFinite(Number(stockData.likes));
        assert.isFinite(Number(stockData.price));
        assert.equal(stockData.stock, randomStocks[0]);
        lastLikes = stockData.likes;
        done();
      })
  })

  test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function(done) {
    chai
      .request(server)
      .get(`/api/stock-prices/?stock=${randomStocks[0]}&like=true`)
      .end((err, res) => {
        const stockData = res.body.stockData;

        assert.equal(res.status, 200);
        assert.isOk(stockData);
        assert.isOk(stockData.stock);
        assert.isFinite(Number(stockData.likes));
        assert.isFinite(Number(stockData.price));
        assert.equal(stockData.stock, randomStocks[0]);
        assert.equal(stockData.likes, lastLikes + 1);
        done();
      })
  })

  test('Viewing two stocks: GET request to /api/stock-prices/', function(done) {
    chai
      .request(server)
      .get(`/api/stock-prices/?stock=${randomStocks[0]}&stock=${randomStocks[1]}&like=true`)
      .end((err, res) => {
        const stockData = res.body.stockData;

        assert.equal(res.status, 200);
        assert.isOk(stockData);
        assert.isArray(stockData);

        for (let i = 0; i < stockData.length; i++) {
          assert.isOk(stockData[i].stock);
          assert.isFinite(Number(stockData[i].rel_likes));
          assert.isFinite(Number(stockData[i].price));
          assert.equal(stockData[i].stock, randomStocks[i]);
        }
        done();
      })
  })

  test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function(done) {
    chai
      .request(server)
      .get(`/api/stock-prices/?stock=${randomStocks[0]}&stock=${randomStocks[1]}&like=true`)
      .end((err, res) => {
        const stockData = res.body.stockData;

        assert.equal(res.status, 200);
        assert.isOk(stockData);
        assert.isArray(stockData);

        for (let i = 0; i < stockData.length; i++) {
          assert.isOk(stockData[i].stock);
          assert.isFinite(Number(stockData[i].rel_likes));
          assert.isFinite(Number(stockData[i].price));
          assert.equal(stockData[i].stock, randomStocks[i]);
        }
        done();
      })
  })
});

const randomString = () => {
  const length = Math.round(Math.random() * 15 + 5);
  let array = [];

  for (let idx = 0; idx < length; idx++) {
    array.push(String
      .fromCharCode(32 + Math.floor(Math.random() * 94))
      .concat(String.fromCharCode(97 + Math.floor(Math.random() * 25)))
      .match(/[0-9a-zA-Z]/g)
      .join('')
    )
  }
  return array.join('');
}
