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

var limitSellData = async (sellLimitOrderData, crypto, currency, activity, res = null) => {
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
        let wallet = await SellWalletBalanceHelper.getSellWalletBalance(sellLimitOrderData.settle_currency, sellLimitOrderData.currency, sellLimitOrderData.user_id);
        let buyBook = await BuyBookHelper.getBuyBookOrder(crypto, currency);
        let fees = await MakerTakerFees.getFeesValue(crypto, currency);
        if (buyBook && buyBook.length > 0) {
            if ((buyBook[0].price >= sellLimitOrderData.limit_price) || (buyBook[0].price <= sellLimitOrderData.stop_price)) {
                if (buyBook[0].quantity >= sellLimitOrderData.quantity) {
                    var availableQuantity = buyBook[0].quantity;
                    sellLimitOrderData.fill_price = buyBook[0].price;
                    delete sellLimitOrderData.id;
                    if (parseFloat(sellLimitOrderData.fill_price * sellLimitOrderData.quantity).toFixed(8) <= parseFloat(wallet.placed_balance).toFixed(8)) {
                        var sellAddedData = {
                            ...sellLimitOrderData
                        }
                        sellAddedData.is_partially_fulfilled = true;
                        var trade_history_data = {
                            ...sellLimitOrderData
                        }
                        if (sellLimitOrderData.quantity >= buyBook[0].quantity) {
                            trade_history_data.fix_quantity = buyBook[0].quantity
                        } else {
                            trade_history_data.fix_quantity = sellLimitOrderData.quantity
                        }
                        trade_history_data.maker_fee = fees.makerFee;
                        trade_history_data.taker_fee = fees.takerFee;
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
                            fill_price: sellLimitOrderData.fill_price
                        };

                        var tradingFees = await TradingFees.getTraddingFees(request, fees.makerFee, fees.takerFee);
                        trade_history_data.user_fee = tradingFees.userFee;
                        trade_history_data.requested_fee = tradingFees.requestedFee;
                        trade_history_data.user_coin = sellLimitOrderData.settle_currency;
                        trade_history_data.requested_coin = sellLimitOrderData.currency;
                        if (trade_history_data.activity_id)
                            delete trade_history_data.activity_id;
                        var tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
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
                                                        recipientName: user_data.first_name
                                                    }
                                                }
                                                console.log(res)
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
                                                        recipientName: user_data.first_name
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
                        return {
                            status: 3,
                            message: 'Insufficient balance to place order'
                        }
                    }
                } else {
                    var remainningQuantity = sellLimitOrderData.quantity - buyBook[0].quantity;
                    remainningQuantity = parseFloat(remainningQuantity).toFixed(8);
                    var feeResult = await MakerTakerFees.getFeesValue(sellLimitOrderData.settle_currency, sellLimitOrderData.currency);
                    if (parseFloat(sellLimitOrderData.fill_price * sellLimitOrderData.quantity).toFixed(8) <= parseFloat(wallet.placed_balance).toFixed(8)) {
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

                        if (sellLimitOrderData.quantity >= buyBook[0].quantity) {
                            trade_history_data.fix_quantity = buyBook[0].quantity;
                        } else {
                            trade_history_data.fix_quantity = sellLimitOrderData.quantity;
                        }

                        trade_history_data.maker_fee = feeResult.makerFee;
                        trade_history_data.taker_fee = feeResult.takerFee;
                        trade_history_data.quantity = buyBook[0].quantity;
                        trade_history_data.requested_user_id = buyBook[0].user_id;
                        trade_history_data.created_at = new Date();

                        var activityResult = await ActivityUpdateHelper.updateActivityData(buyBook[0].activity_id, trade_history_data);
                        console.log("activityResult", activityResult)

                        var request = {
                            requested_user_id: trade_history_data.requested_user_id,
                            user_id: trade_history_data.user_id,
                            currency: sellLimitOrderData.currency,
                            side: sellLimitOrderData.side,
                            settle_currency: sellLimitOrderData.settle_currency,
                            quantity: buyBook[0].quantity,
                            fill_price: sellLimitOrderData.fill_price
                        }

                        var tradingFees = await TradingFees.getTraddingFees(request, fees.makerFee, fees.takerFee);

                        trade_history_data.user_fee = (tradingFees.userFee)
                        trade_history_data.requested_fee = (tradingFees.requestedFee);
                        trade_history_data.user_coin = sellLimitOrderData.settle_currency;
                        trade_history_data.requested_coin = sellLimitOrderData.currency;
                        if (trade_history_data.activity_id)
                            delete trade_history_data.activity_id;
                        console.log(trade_history_data)

                        var TradeHistory = await TradeAdd.addTradeHistory(trade_history_data);

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
                                                    recipientName: user_data.first_name
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
                            var responseData = await module.exports.limitSellData(resendDataLimit, resendDataLimit.settle_currency, resendDataLimit.currency, activityResult, res);
                            return responseData
                        }

                    } else {
                        return {
                            status: 3,
                            message: 'Insufficient balance to place order'
                        }
                    }
                }
            } else {
                if (parseFloat(sellLimitOrderData.quantity * sellLimitOrderData.limit_price).toFixed(8) <= parseFloat(wallet.placed_balance).toFixed(8)) {
                    var sellAddedData = {
                        ...sellLimitOrderData
                    }
                    sellAddedData.fix_quantity = sellAddedData.quantity;
                    sellAddedData.maker_fee = fees.makerFee;
                    sellAddedData.taker_fee = fees.takerFee;
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
                    }
                    var addSellBook = await SellAdd.SellOrderAdd(sellAddedData);
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
                                                recipientName: user_data.first_name
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
                } else {
                    return {
                        status: 3,
                        message: 'Insufficient balance to place order'
                    }
                }
            }
        } else {
            if (parseFloat(sellLimitOrderData.quantity * sellLimitOrderData.limit_price).toFixed(8) <= parseFloat(wallet.placed_balance).toFixed(8)) {
                var sellAddedData = {
                    ...sellLimitOrderData
                }
                sellAddedData.fix_quantity = sellAddedData.quantity;
                sellAddedData.maker_fee = fees.makerFee;
                sellAddedData.taker_fee = fees.takerFee;
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
                }
                var addSellBook = await SellAdd.SellOrderAdd(sellAddedData);
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
                                            recipientName: user_data.first_name
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
            } else {
                return {
                    status: 3,
                    message: 'Insufficient balance to place order'
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    limitSellData
}