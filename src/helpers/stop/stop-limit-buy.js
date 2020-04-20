var lastTradePrice = require("../check-last-trade-price");
var activityDetails = require("../activity/get-activity-details");
var LimitBuyMatch = require("../limit/limit-buy-match");
var pendingOrderDelet = require("../pending/delete-pending-order");

var stopLimitBuy = async (now, pending_order_book) => {
    var order = pending_order_book;
    var order_id = pending_order_book.id
    var lastPrice = await lastTradePrice.getLastTradePrice(order.settle_currency, order.currency);
    var getActivityDetails = await activityDetails.getActivityDataId(order.activity_id);
    if (lastPrice >= order.stop_price) {
        var buyMatchResponse = await LimitBuyMatch.limitData(order, order.settle_currency, order.currency, getActivityDetails);
        if (buyMatchResponse) {
            var pendingOrder = await pendingOrderDelet.deletePendingOrder(order_id)
        }
    }

    // Emit event here
}

module.exports = {
    stopLimitBuy
}