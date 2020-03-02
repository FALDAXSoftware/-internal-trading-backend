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
// router.post('/api/v1/simplex/simplex-details', SimplexController.getUserQouteDetails);
// router.post('/api/v1/simplex/get-partner-data',SimplexController.getPartnerData);
router.post('/orders/market-sell-create', TradeController.marketSell);
router.post('/orders/market-buy-create', TradeController.marketBuy);

module.exports = router;
