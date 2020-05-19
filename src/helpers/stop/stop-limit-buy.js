var lastTradePrice = require("../check-last-trade-price");
var activityDetails = require("../activity/get-activity-details");
var LimitBuyMatch = require("../limit/limit-buy-match");
var pendingOrderDelet = require("../pending/delete-pending-order");
var CoinModel = require("../../models/Coins");

var stopLimitBuy = async (now, pending_order_book) => {
    var order = pending_order_book;
    var order_id = pending_order_book.id
    var lastPrice = await lastTradePrice.getLastTradePrice(order.settle_currency, order.currency);
    var getActivityDetails = await activityDetails.getActivityDataId(order.activity_id);
    var coinSql = `SELECT id, coin
                        FROM coins
                        WHERE is_active = 'true' AND deleted_at IS NULL
                        AND (coin = '${order.currency}' OR coin = '${order.settle_currency}')`

    var coinData = await CoinModel.knex().raw(coinSql);
    coinData = coinData.rows
    var crypto_coin_id;
    var currency_coin_id;
    for (var i = 0; i < coinData.length; i++) {
        if (order.settle_currency == coinData[i].coin) {
            crypto_coin_id = coinData[i].id;
        } else if (order.currency == coinData[i].coin) {
            currency_coin_id = coinData[i].id;
        }
    }
    console.log("lastPrice", lastPrice);
    console.log("order.stop_price", order.stop_price)
    if (lastPrice >= order.stop_price) {
        var buyMatchResponse = await LimitBuyMatch.limitData(order, order.settle_currency, order.currency, getActivityDetails, null, crypto_coin_id, currency_coin_id);
        if (buyMatchResponse) {
            var pendingOrder = await pendingOrderDelet.deletePendingOrder(order_id)
        }
    }

    // Emit event here
}

module.exports = {
    stopLimitBuy
}