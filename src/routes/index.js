// import * as socket from "ejs";

var express = require('express');
var router = express.Router();

// var app = express();
// route grouping
var TradeController = require('../controllers/v1/TradeController');
var TradingViewController = require('../controllers/v1/TradingViewController');
var UserFavouritesController = require("../controllers/v1/UserFavourites");
var DashboardController = require("../controllers/v1/DashboardController");
var TradeDesk = require("../controllers/v1/TradeDeskController");
var Helpers = require("../helpers/helpers")
var InfluxController = require("../controllers/v1/RootController");

const redis = require("redis");
const axios = require("axios");
const port_redis = 6379;

const redis_client = redis.createClient({
  port: process.env.REDIS_PORT,               // replace with your port
  host: process.env.REDIS_HOST,        // replace with your hostanme or IP address
  password: process.env.REDIS_PASSWORD   // replace with your password
});

router.get("/soc", function (req, res) {
  io.emit('user-connecting', { name: req.user.name });
  return res.json({ status: 1 })
});

//Middleware Function to Check Cache
checkCache = (req, res, next) => {
  // console.log("req", req)
  // console.log("INISDE CACHE CHECKING")
  var { symbol } = req.query;
  // console.log(symbol)
  redis_client.get(symbol, async (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    }
    //if no match found
    if (data != null) {
      res.send(JSON.parse(data));
    } else {
      //proceed to next middleware function
      // app.use('/', require('./routes/index'));
      next();
      // console.log("NO CACHE FOUND")
      // var { symbol, resolution, from, to } = req.query;
      // console.log("symbol, resolution, from, to", symbol, resolution, from, to)
      // const starShipInfo = await axios.get(
      //   `http://localhost:3013/cached/trading/view?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`
      // );

      // console.log("starShipInfo", starShipInfo.data)
      // //get data from response
      // const starShipInfoData = starShipInfo.data;
      // var value = {
      //   'symbol': symbol,
      //   'resolution': resolution,
      //   from: from,
      //   to: to
      // }

      // var dataValue = value.symbol + '-' + value.resolution;
      // console.log("dataValue", dataValue);
      // console.log("JSON.stringify(starShipInfoData)", JSON.stringify(starShipInfoData))
      // // }


      // //add data to Redis
      // redis_client.setex(dataValue, 10, JSON.stringify(starShipInfoData));

      // return res
      //   .status(200)
      //   .json(starShipInfoData)
    }
  });
};

//Middleware Function to Check Cache
checkInstrumentCache = (req, res, next) => {
  // console.log("req", req)
  // console.log("INISDE CACHE CHECKING")
  redis_client.get("instrument", async (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    }
    //if no match found
    if (data != null) {
      res.send(JSON.parse(data));
    } else {
      //proceed to next middleware function
      // app.use('/', require('./routes/index'));
      next();
    }
  });
};

checkPortfolioCache = async (req, res, next) => {
  var user_id = await Helpers.getUserId(req.headers, res);
  redis_client.get(`${user_id}-portfolio`, async (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    }
    //if no match found
    if (data != null) {
      res.send(JSON.parse(data));
    } else {
      //proceed to next middleware function
      // app.use('/', require('./routes/index'));
      next();
    }
  });
}

checkActivityCache = async (req, res, next) => {
  var user_id = await Helpers.getUserId(req.headers, res);
  redis_client.get(`${user_id}-activity`, async (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    }
    //if no match found
    if (data != null) {
      res.send(JSON.parse(data));
    } else {
      //proceed to next middleware function
      // app.use('/', require('./routes/index'));
      next();
    }
  });
}

// router.post('/orders/market-sell-create', TradeController.marketSell);
// router.post('/orders/market-buy-create', TradeController.marketBuy);
// router.post('/orders/limit-buy-order-create', TradeController.limitBuy);
// router.post('/orders/limit-sell-order-create', TradeController.limitSell);

// Queue Implementation
router.post('/orders/market-sell-create', TradeController.marketSellQueue);
router.post('/orders/market-buy-create', TradeController.marketBuyQueue);
router.post('/orders/limit-buy-order-create', TradeController.limitBuyOrderQueue);
router.post('/orders/limit-sell-order-create', TradeController.limitSellOrderQueue);


router.post('/orders/pending-buy-order-create', TradeController.stopLimitBuyOrder);
router.post('/orders/pending-sell-order-create', TradeController.stopLimitSellOrder);
router.post('/trade/add-favourite-pair', UserFavouritesController.addFavouritesData)
router.post('/cancel-pending-order', TradeController.cancelPendingOrder)
router.get('/get-chart-data-graph', UserFavouritesController.getFavouritesData);
router.get('/get-activity-data', checkActivityCache, DashboardController.getActivityData)
router.get('/get-portfolio-data', checkPortfolioCache, DashboardController.getPortfolioData);
router.get('/cached-portfolio-details', DashboardController.getCachedPortfolioData);
router.get('/update-order-book', DashboardController.updateBuyOrderBook);
router.get('/update-sell-order-book', DashboardController.updateSellOrderBook);
router.get("/get-pairs-value", TradeDesk.getQuantityMinMaxValue);
router.post("/update-pairs-value", TradeDesk.updateQuantityMinMaxValue)
router.get("/get-spread-value", TradeDesk.getSpreadValue)
router.get("/get-tradedesk-user-balances", TradeDesk.getWalletTradeDeskBalance)
router.get("/get-instrument-value-data", checkInstrumentCache, DashboardController.getCachedInstrumentDataValue)
router.get("/cached-instrument-details", DashboardController.getCachedInstrumentDataValue)
router.get("/get-instrument-data", checkInstrumentCache, DashboardController.getCachedInstrumentDataValue)
router.get("/depth-chart-details", checkCache, DashboardController.getCachedDepthChartDetails)
router.get("/cached-depth-chart-details", DashboardController.getCachedDepthChartDetails)
router.get("/depth-chart-details-value", DashboardController.getValueDepthChartDetails)
// router.get('/order/candle-stick-chart', TradeController.getCandleStickData)
router.get("/get-user-trade-history", TradeController.getUserOrdersData);
router.get("/system-health-check", TradeController.getHealthCheck);

router.get("/update-symbol-cache", UserFavouritesController.updateReqPairCache);

// Trading View API
router.get('/tradingview/config', TradingViewController.getConfig);
router.get('/tradingview/time', TradingViewController.getCurrentTime);
router.get('/tradingview/symbols', TradingViewController.getSymbolInfo);
router.get('/tradingview/history', TradingViewController.getHistoryData);

// write influx data
router.get("/write-influx-data", InfluxController.writeInfluxData);
router.get("/get-influx-data", InfluxController.getInfluxData);
router.get("/delete-influx-data", InfluxController.deleteInfluxData);

router.get("/get-user-trade-value", InfluxController.getUserTradeData);
router.get("/get-user-tier-0-report", InfluxController.getTier0Report);
router.get("/get-user-trade-history-data", InfluxController.getUserTier0DataReport);

module.exports = router;
