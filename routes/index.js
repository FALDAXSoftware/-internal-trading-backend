// import * as socket from "ejs";

var express = require('express');
var router = express.Router();

// var app = express();
// route grouping
var TradeController = require('../controllers/v1/TradeController');
router.get("/soc", function (req, res) {
  io.emit('user-connecting', { name: req.user.name });
  return res.json({ status: 1 })
});
router.get("/api", function (req, res) {
  console.log("socket",req.socket);

  req.socket.on("incoming", function (data) {
    console.log("Incoming Data", data);
  })
  return res.json({ status: 1 })
});

router.post('/orders/market-sell-create', TradeController.marketSell);
router.post('/orders/market-buy-create', TradeController.marketBuy);
router.post('/orders/limit-buy-order-create', TradeController.limitBuy);
router.post('/orders/limit-sell-order-create', TradeController.limitSell);

module.exports = router;
