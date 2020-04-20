var lastTradePrice = require("../check-last-trade-price");
var activityDetails = require("../activity/get-activity-details");
var LimitSellMatch = require("../limit/limit-sell-match");
var pendingOrderDelet = require("../pending/delete-pending-order");

var stopLimitSell = async (now, pending_order_book) => {
    var order = pending_order_book;
    var order_id = pending_order_book.id
    var checkLastPrice = await lastTradePrice.getLastTradePrice(order.settle_currency, order.currency);
    console.log("checkLastPrice", checkLastPrice)
    var activityResult = await activityDetails.getActivityDataId(order.activity_id);
    console.log("activityResult", activityResult)
    console.log("checkLastPrice <= order.stop_price", checkLastPrice <= order.stop_price)
    if (checkLastPrice <= order.stop_price) {
        var sellMatchResponse = await LimitSellMatch.limitSellData(order, order.settle_currency, order.currency, activityResult);
        if (sellMatchResponse) {
            var pendingOrder = await pendingOrderDelet.deletePendingOrder(order_id)
        }
    }
    // Emit trade event
}

module.exports = {
    stopLimitSell
}