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
  return res.json({ status: 1 })
});

router.post('/orders/market-sell-create', TradeController.marketSell);
router.post('/orders/market-buy-create', TradeController.marketBuy);
router.post('/orders/limit-buy-order-create', TradeController.limitBuy);
router.post('/orders/limit-sell-order-create', TradeController.limitSell);

module.exports = router;
