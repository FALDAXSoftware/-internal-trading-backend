var SellWalletBalanceHelper = require("../wallet/get-sell-wallet-balance");
var BuyBookHelper = require("../buy/get-buy-book-order");
var MakerTakerFees = require("../wallet/get-maker-taker-fees");
var ActivityHelper = require("../../helpers/activity/add");
var SellAdd = require("../sell/add-sell-order");
var ActivityUpdateHelper = require("../../helpers/activity/update");
var TradingFees = require("../../helpers/wallet/get-trading-fees");
var TradeAdd = require("../../helpers/trade/add");
var buyUpdate = require("../buy/update-buy-order");
var buyDelete = require("../buy/delete-order");
var UserNotifications = require("../../models/UserNotifications");
var Helper = require("../../helpers/helpers");
var Users = require("../../models/UsersModel");
var socketHelper = require("../../helpers/sockets/emit-trades");
var RefferalHelper = require("../get-refffered-amount");
var fiatValueHelper = require("../get-fiat-value");

var limitSellData = async (sellLimitOrderData, crypto, currency, activity, res = null, crypto_coin_id = null, currency_coin_id = null, txnGroupId = null) => {
    try {
        var quantityValue = sellLimitOrderData.quantity;
        var userIds = [];
        userIds.push(parseInt(sellLimitOrderData.user_id));
        if (sellLimitOrderData.orderQuantity) {
            return {
                status: 3,
                message: 'Invalid Quantity'
            }
        }
        let buyBook = await BuyBookHelper.getBuyBookOrder(crypto, currency);
        var tradeOrder;
        if (sellLimitOrderData.order_type == "StopLimit") {
            const checkUser = Helper.checkWhichUser(sellLimitOrderData.user_id);
            if (checkUser == true) {
                sellLimitOrderData.placed_by = process.env.TRADEDESK_MANUAL
            } else {
                sellLimitOrderData.placed_by = process.env.TRADEDESK_USER
            }
        }
        if (buyBook && buyBook.length > 0) {
            if ((buyBook[0].order_type == "Limit") ? (buyBook[0].price >= sellLimitOrderData.limit_price) : (buyBook[0].price <= sellLimitOrderData.stop_price && buyBook[0].price >= sellLimitOrderData.limit_price)) {
                if (buyBook[0].quantity >= sellLimitOrderData.quantity) {
                    var availableQuantity = buyBook[0].quantity;
                    sellLimitOrderData.fill_price = buyBook[0].price;
                    delete sellLimitOrderData.id;
                    var sellAddedData = {
                        ...sellLimitOrderData
                    }
                    sellAddedData.is_partially_fulfilled = true;
                    var trade_history_data = {
                        ...sellLimitOrderData
                    }
                    trade_history_data.fix_quantity = quantityValue;
                    trade_history_data.quantity = sellLimitOrderData.quantity
                    trade_history_data.maker_fee = 0.0;
                    trade_history_data.taker_fee = 0.0;
                    trade_history_data.requested_user_id = buyBook[0].user_id;
                    trade_history_data.created_at = new Date();
                    let updatedActivity = await ActivityUpdateHelper.updateActivityData(buyBook[0].activity_id, trade_history_data);
                    userIds.push(parseInt(trade_history_data.requested_user_id));

                    var request = {
                        requested_user_id: trade_history_data.requested_user_id,
                        user_id: trade_history_data.user_id,
                        currency: sellLimitOrderData.currency,
                        side: sellLimitOrderData.side,
                        settle_currency: sellLimitOrderData.settle_currency,
                        quantity: sellLimitOrderData.quantity,
                        fill_price: sellLimitOrderData.fill_price,
                        crypto_coin_id,
                        currency_coin_id
                    };

                    var tradingFees = await TradingFees.getTraddingFees(request);
                    trade_history_data.user_fee = tradingFees.userFee;
                    trade_history_data.requested_fee = tradingFees.requestedFee;
                    trade_history_data.user_coin = sellLimitOrderData.settle_currency;
                    trade_history_data.requested_coin = sellLimitOrderData.currency;
                    trade_history_data.maker_fee = tradingFees.maker_fee;
                    trade_history_data.taker_fee = tradingFees.taker_fee;
                    trade_history_data.fiat_values = await fiatValueHelper.getFiatValue(crypto, currency);
                    trade_history_data.txn_group_id = txnGroupId;
                    if (trade_history_data.activity_id)
                        delete trade_history_data.activity_id;
                    var tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                    tradeOrder = tradeHistory;
                    var remainningQuantity = availableQuantity - quantityValue;
                    if (remainningQuantity > 0) {
                        let updateBuyBook = await buyUpdate.updateBuyBook(buyBook[0].id, {
                            quantity: remainningQuantity
                        });
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
                                                templateSlug: "trade_execute",
                                                email: user_data.email,
                                                user_detail: user_data,
                                                formatData: {
                                                    recipientName: user_data.first_name,
                                                    side: tradeOrder.side,
                                                    pair: tradeOrder.symbol,
                                                    order_type: tradeOrder.order_type,
                                                    quantity: tradeOrder.quantity,
                                                    price: tradeOrder.limit_price,
                                                }
                                            }
                                            // console.log(res)
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

                        //Emit data in rooms
                        let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                        return {
                            status: 1,
                            message: 'Order Success'
                        }
                    } else {
                        await buyDelete.deleteOrder(buyBook[0].id)
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
                                                templateSlug: "trade_execute",
                                                email: user_data.email,
                                                user_detail: user_data,
                                                formatData: {
                                                    recipientName: user_data.first_name,
                                                    side: tradeOrder.side,
                                                    pair: tradeOrder.symbol,
                                                    order_type: tradeOrder.order_type,
                                                    quantity: tradeOrder.quantity,
                                                    price: tradeOrder.limit_price,
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

                        //Emit data in rooms
                        let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                        return {
                            status: 1,
                            message: 'Order Success'
                        }
                    }
                } else {
                    console.log("ELSE", remainningQuantity)
                    var remainningQuantity = sellLimitOrderData.quantity - buyBook[0].quantity;
                    remainningQuantity = parseFloat(remainningQuantity).toFixed(8);
                    var sellAddedData = {
                        ...sellLimitOrderData
                    }
                    sellAddedData.is_partially_fulfilled = true;
                    var resendData = {
                        ...sellLimitOrderData
                    }
                    buyBook[0].quantity = (buyBook[0].quantity).toFixed(3);
                    buyBook[0].price = (buyBook[0].price).toFixed(5);

                    sellLimitOrderData.quantity = buyBook[0].quantity;
                    sellLimitOrderData.order_status = "partially_filled";
                    sellLimitOrderData.fill_price = buyBook[0].price;

                    var deleteResult = await buyDelete.deleteOrder(buyBook[0].id);
                    delete sellLimitOrderData.id;
                    var trade_history_data = {
                        ...sellLimitOrderData
                    }

                    trade_history_data.fix_quantity = quantityValue;
                    trade_history_data.quantity = sellLimitOrderData.quantity

                    trade_history_data.maker_fee = 0.0;
                    trade_history_data.taker_fee = 0.0;
                    trade_history_data.quantity = buyBook[0].quantity;
                    trade_history_data.requested_user_id = buyBook[0].user_id;
                    trade_history_data.created_at = new Date();

                    var activityResult = await ActivityUpdateHelper.updateActivityData(buyBook[0].activity_id, trade_history_data);
                    console.log("activityResult", JSON.stringify(activityResult))

                    var request = {
                        requested_user_id: trade_history_data.requested_user_id,
                        user_id: trade_history_data.user_id,
                        currency: sellLimitOrderData.currency,
                        side: sellLimitOrderData.side,
                        settle_currency: sellLimitOrderData.settle_currency,
                        quantity: buyBook[0].quantity,
                        fill_price: sellLimitOrderData.fill_price,
                        crypto_coin_id,
                        currency_coin_id
                    }

                    var tradingFees = await TradingFees.getTraddingFees(request);

                    trade_history_data.user_fee = (tradingFees.userFee)
                    trade_history_data.requested_fee = (tradingFees.requestedFee);
                    trade_history_data.user_coin = sellLimitOrderData.settle_currency;
                    trade_history_data.requested_coin = sellLimitOrderData.currency;
                    trade_history_data.maker_fee = tradingFees.maker_fee;
                    trade_history_data.taker_fee = tradingFees.taker_fee;
                    trade_history_data.fiat_values = await fiatValueHelper.getFiatValue(crypto, currency);
                    trade_history_data.txn_group_id = txnGroupId;
                    if (trade_history_data.activity_id)
                        delete trade_history_data.activity_id;
                    console.log(JSON.stringify(trade_history_data))

                    var tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                    tradeOrder = tradeHistory;

                    await buyDelete.deleteOrder(buyBook[0].id);

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
                                            templateSlug: "trade_execute",
                                            email: user_data.email,
                                            user_detail: user_data,
                                            formatData: {
                                                recipientName: user_data.first_name,
                                                side: tradeOrder.side,
                                                pair: tradeOrder.symbol,
                                                order_type: tradeOrder.order_type,
                                                quantity: tradeOrder.quantity,
                                                price: tradeOrder.limit_price,
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

                    //Emit data in rooms
                    let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)

                    var resendDataLimit = {
                        ...sellLimitOrderData
                    }

                    resendDataLimit.quantity = remainningQuantity;
                    resendDataLimit.activity_id = activityResult.id;

                    if (remainningQuantity > 0) {
                        var responseData = await module.exports.limitSellData(resendDataLimit, resendDataLimit.settle_currency, resendDataLimit.currency, activityResult, res, crypto_coin_id, currency_coin_id);
                        return responseData
                    }
                }
                // Check for referral
                let referredData = await RefferalHelper.getAmount(tradeOrder, tradeOrder.user_id, tradeOrder.id);
            } else {
                console.log("sellLimitOrderData.quantity", sellLimitOrderData.quantity)
                var sellAddedData = {
                    ...sellLimitOrderData
                }
                sellAddedData.fix_quantity = sellAddedData.quantity;
                sellAddedData.maker_fee = 0.0;
                sellAddedData.taker_fee = 0.0;
                delete sellAddedData.id;
                delete sellAddedData.side;
                delete sellAddedData.activity_id;
                var activity = await ActivityHelper.addActivityData(sellAddedData);
                sellAddedData.is_partially_fulfilled = true;
                sellLimitOrderData.is_filled = false;
                sellAddedData.activity_id = activity.id;
                sellLimitOrderData.added = true;
                if (sellAddedData.order_type == "StopLimit") {
                    sellAddedData.order_type = "Limit";
                    sellAddedData.price = sellLimitOrderData.limit_price
                }
                var addSellBook = await SellAdd.SellOrderAdd(sellAddedData, crypto_coin_id);
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
                                        templateSlug: "trade_partially_filled",
                                        email: user_data.email,
                                        user_detail: user_data,
                                        formatData: {
                                            recipientName: user_data.first_name,
                                            pair: sellLimitOrderData.symbol
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
                    status: 2,
                    message: 'Order Partially Fulfilled and Added to Sell Book'
                }
            }
        } else {
            console.log("sellLimitOrderData.quantity", sellLimitOrderData.quantity)
            var sellAddedData = {
                ...sellLimitOrderData
            }
            sellAddedData.fix_quantity = sellAddedData.quantity;
            sellAddedData.maker_fee = 0.0;
            sellAddedData.taker_fee = 0.0;
            delete sellAddedData.id;
            delete sellAddedData.side;
            delete sellAddedData.activity_id;
            var activity = ActivityHelper.addActivityData(sellAddedData);
            sellAddedData.is_partially_fulfilled = true;
            sellLimitOrderData.is_filled = false;
            sellAddedData.activity_id = activity.id;
            sellLimitOrderData.added = true;
            if (sellAddedData.order_type == "StopLimit") {
                sellAddedData.order_type = "Limit";
                sellAddedData.price = sellLimitOrderData.limit_price
            }
            var addSellBook = await SellAdd.SellOrderAdd(sellAddedData, crypto_coin_id);
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
                                    templateSlug: "trade_partially_filled",
                                    email: user_data.email,
                                    user_detail: user_data,
                                    formatData: {
                                        recipientName: user_data.first_name,
                                        pair: sellLimitOrderData.symbol
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
                status: 2,
                message: 'Order Partially Fulfilled and Added to Sell Book'
            }
        }
    } catch (error) {
        console.log(JSON.stringify(error));
    }
}

module.exports = {
    limitSellData
}