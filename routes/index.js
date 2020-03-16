// import * as socket from "ejs";

var express = require('express');
var router = express.Router();

// var app = express();
// route grouping
var TradeController = require('../controllers/v1/TradeController');
var TradingViewController = require('../controllers/v1/TradingViewController');

router.get("/soc", function (req, res) {
  io.emit('user-connecting', { name: req.user.name });
  return res.json({ status: 1 })
});
router.get("/api", function (req, res) {
  console.log("socket", req.socket);

  req.socket.on("incoming", function (data) {
    console.log("Incoming Data", data);
  })
  return res.json({ status: 1 })
});

router.post('/orders/market-sell-create', TradeController.marketSell);
router.post('/orders/market-buy-create', TradeController.marketBuy);
router.post('/orders/limit-buy-order-create', TradeController.limitBuy);
router.post('/orders/limit-sell-order-create', TradeController.limitSell);
router.post('/orders/pending-buy-order-create', TradeController.stopLimitBuyOrder);
router.post('/orders/pending-sell-order-create', TradeController.stopLimitSellOrder);
// router.get('/order/candle-stick-chart', TradeController.getCandleStickData)

// Trading View API
router.get('/tradingview/config', TradingViewController.getConfig);
router.get('/tradingview/time', TradingViewController.getCurrentTime);
router.get('/tradingview/symbols', TradingViewController.getSymbolInfo);
router.get('/tradingview/history', TradingViewController.getHistoryData);

module.exports = router;
