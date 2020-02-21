var express = require('express');
var router = express.Router();

// var app = express();
// route grouping
var TradeController = require('../controllers/v1/TradeController');
// router.post('/api/v1/simplex/simplex-details', SimplexController.getUserQouteDetails);
// router.post('/api/v1/simplex/get-partner-data',SimplexController.getPartnerData);
router.get("api/test", function(req, res){
    return res.json({status:1})
});
router.post('/api/v1/tradding/orders/market-sell-create', TradeController.marketSell);

module.exports = router;
