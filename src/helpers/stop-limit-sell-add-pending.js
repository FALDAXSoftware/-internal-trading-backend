var Currency = require("./currency");
var SellWalletBalanceHelper = require("../helpers/wallet/get-sell-wallet-balance");
var MakerTakerFees = require("../helpers/wallet/get-maker-taker-fees");
var WalletBalanceChecking = require("./wallet-status");
var ActivityAdd = require("../helpers/activity/add");
var PendingAdd = require("./pending/add-pending-order");
var UserNotifications = require("../models/UserNotifications");
var PairsModel = require("../models/Pairs");
var Helper = require("../helpers/helpers");
var Users = require("../models/UsersModel");
var socketHelper = require("../helpers/sockets/emit-trades");
var moment = require('moment');


var stopSellAdd = async (symbol, user_id, side, order_type, orderQuantity, limit_price, stop_price, res) => {
    var userIds = [];
    userIds.push(user_id);
    var pairDetails = await PairsModel
        .query()
        .first()
        .select("name", "quantity_precision", "price_precision")
        .where("deleted_at", null)
        .andWhere("name", symbol)
        .orderBy("id", "DESC")

    let { crypto, currency } = await Currency.get_currencies(symbol);
    const checkUser = Helper.checkWhichUser(user_id);
    var now = new Date();
    var limitSellOrder = ({
        'user_id': user_id,
        'symbol': symbol,
        'side': side,
        'order_type': order_type,
        'maximum_time': moment(now)
            .add(1, 'years')
            .format(),
        'fill_price': 0.0,
        'limit_price': parseFloat(limit_price).toFixed(pairDetails.price_precision),
        'stop_price': parseFloat(stop_price).toFixed(pairDetails.price_precision),
        'price': 0.0,
        'quantity': parseFloat(orderQuantity).toFixed(pairDetails.quantity_precision),
        'settle_currency': crypto,
        'order_status': "open",
        'currency': currency,
        'placed_by': (checkUser ? process.env.TRADEDESK_MANUAL : process.env.TRADEDESK_USER)
    });

    let wallet = await SellWalletBalanceHelper.getSellWalletBalance(crypto, currency, user_id);

    let fees = await MakerTakerFees.getFeesValue(crypto, currency);

    var resultData = {
        ...limitSellOrder
    }
    resultData.is_market = false;
    resultData.fix_quantity = parseFloat(orderQuantity).toFixed(pairDetails.quantity_precision);
    resultData.maker_fee = fees.makerFee;
    resultData.taker_fee = fees.takerFee;

    var resultPendng = await WalletBalanceChecking.walletStatus(limitSellOrder, wallet);

    if (resultPendng == true) {
        var result = await ActivityAdd.addActivityData(limitSellOrder);

        limitSellOrder.activity_id = result.id;
        var data = await PendingAdd.addPendingBook(limitSellOrder);
        // console.log("data", data);
        // Send Notification to users
        for (var i = 0; i < userIds.length; i++) {
            // Notification Sending for users
            var userNotification = await UserNotifications.getSingleData({
                user_id: userIds[i],
                deleted_at: null,
                slug: 'trade_execute'
            })
            var user_data = await Users.getSingleData({
                deleted_at: null,
                id: userIds[i],
                is_active: true
            });
            if (user_data != undefined) {
                if (userNotification != undefined) {
                    if (userNotification.email == true || userNotification.email == "true") {
                        if (user_data.email != undefined) {
                            var allData = {
                                template: "emails/general_mail.ejs",
                                templateSlug: "trade_stoplimit_pending",
                                email: user_data.email,
                                user_detail: user_data,
                                formatData: {
                                    recipientName: user_data.first_name,
                                    side: side,
                                    pair: symbol,
                                    order_type: order_type,
                                    quantity: orderQuantity,
                                    price: limit_price,
                                    stop_price: stop_price,
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

        // Emit Socket Event
        let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)

        return {
            status: 1,
            message: ''
        };
    } else {
        return {
            status: 2,
            message: 'Insufficient balance to place order'
        }
    }
}

module.exports = {
    stopSellAdd
}