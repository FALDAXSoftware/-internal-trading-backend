var lastTradePrice = require("../check-last-trade-price");
var activityDetails = require("../activity/get-activity-details");
var LimitSellMatch = require("../limit/limit-sell-match");
var pendingOrderDelet = require("../pending/delete-pending-order");
var CoinModel = require("../../models/Coins");

var stopLimitSell = async (now, pending_order_book) => {
    console.log("pending_order_book", pending_order_book)
    var order = pending_order_book;
    var order_id = pending_order_book.id
    var checkLastPrice = await lastTradePrice.getLastTradePrice(order.settle_currency, order.currency);
    console.log("checkLastPrice", checkLastPrice)
    var activityResult = await activityDetails.getActivityDataId(order.activity_id);
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
    console.log("order.stop_price", order.stop_price)
    console.log("checkLastPrice <= order.stop_price", checkLastPrice <= order.stop_price)
    if (checkLastPrice <= order.stop_price) {
        var allOrderData=[];
        var sellMatchResponse = await LimitSellMatch.limitSellData(order, order.settle_currency, order.currency, activityResult, null, crypto_coin_id, currency_coin_id, allOrderData);
        console.log('sellMatchResponse', sellMatchResponse);
        if (sellMatchResponse.status == 1) {
            // Send Email notification in single
            var userData = sellMatchResponse.tradeData.userIds;
            var tradeData = sellMatchResponse.tradeData.orderData;
            // var tradeQuantity = tradeData.reduce( (current, next)=>current+next.quantity, 0 );
            console.log("tradeData", JSON.stringify(tradeData));
            for (var i = 0; i < userData.length; i++) {
                // Notification Sending for users
                var userNotification = await UserNotifications.getSingleData({
                    user_id: userData[i],
                    deleted_at: null,
                    slug: 'trade_execute'
                })
                var user_data = await Users.getSingleData({
                    deleted_at: null,
                    id: userData[i],
                    is_active: true
                });
                if (user_data != undefined) {
                    if (userNotification != undefined) {
                        if (userNotification.email == true || userNotification.email == "true") {
                            if (user_data.email != undefined) {
                                var allData = {
                                    template: "emails/general_mail.ejs",
                                    templateSlug: "trade_execute",
                                    email: user_data.email,
                                    user_detail: user_data,
                                    formatData: {
                                        recipientName: user_data.first_name,
                                        side: order.side,
                                        pair: order.symbol,
                                        order_type: order.order_type,
                                        quantity: order.orderQuantity,
                                        allTradeData: tradeData
                                    }

                                }
                                await Helper.SendEmail(res, allData)
                            }
                        }
                        if (userNotification.text == true || userNotification.text == "true") {
                            if (user_data.phone_number != undefined) {
                                // await sails.helpers.notification.send.text("trade_execute", user_data)
                            }
                        }
                    }
                }
            }
        }
        if (sellMatchResponse) {
            var pendingOrder = await pendingOrderDelet.deletePendingOrder(order_id)
        }
    }
    // Emit trade event
}

module.exports = {
    stopLimitSell
}