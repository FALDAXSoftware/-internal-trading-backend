// import * as socket from "ejs";

var express = require('express');
var router = express.Router();

// var app = express();
// route grouping
var TradeController = require('../controllers/v1/TradeController');
var TradingViewController = require('../controllers/v1/TradingViewController');
var UserFavouritesController = require("../controllers/v1/UserFavourites");
var DashboardController = require("../controllers/v1/DashboardController");

router.get("/soc", function (req, res) {
  io.emit('user-connecting', { name: req.user.name });
  return res.json({ status: 1 })
});
// router.get("/api", async function (req, res) {
//   try{
//     let socket_emit = require("../helpers/sockets/emit-trades");
//     var all = await socket_emit.emitTrades("XRP", "BTC", [1434])
//     console.log("all",all);
//     return res.json({ status: 1 })
//   }catch(err){
//     console.log("ERr", err);
//     return res.json({ status: 0 })
//   }
//
// });

router.post('/orders/market-sell-create', TradeController.marketSell);
router.post('/orders/market-buy-create', TradeController.marketBuy);
router.post('/orders/limit-buy-order-create', TradeController.limitBuy);
router.post('/orders/limit-sell-order-create', TradeController.limitSell);
router.post('/orders/pending-buy-order-create', TradeController.stopLimitBuyOrder);
router.post('/orders/pending-sell-order-create', TradeController.stopLimitSellOrder);
router.post('/trade/add-favourite-pair', UserFavouritesController.addFavouritesData)
router.post('/cancel-pending-order', TradeController.cancelPendingOrder)
router.get('/get-chart-data-graph', UserFavouritesController.getFavouritesData);
router.get('/get-activity-data', DashboardController.getActivityData)
router.get('/get-portfolio-data', DashboardController.getPortfolioData);
router.get('/update-order-book', DashboardController.updateBuyOrderBook);
router.get('/update-sell-order-book', DashboardController.updateSellOrderBook);
// router.get('/order/candle-stick-chart', TradeController.getCandleStickData)

// Trading View API
router.get('/tradingview/config', TradingViewController.getConfig);
router.get('/tradingview/time', TradingViewController.getCurrentTime);
router.get('/tradingview/symbols', TradingViewController.getSymbolInfo);
router.get('/tradingview/history', TradingViewController.getHistoryData);

module.exports = router;
