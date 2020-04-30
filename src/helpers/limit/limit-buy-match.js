var WalletBalanceHelper = require("../../helpers/wallet/get-wallet-balance");
var SellBookHelper = require("../../helpers/sell/get-sell-book-order");
var MakerTakerFees = require("../../helpers/wallet/get-maker-taker-fees");
var BuyAdd = require("../../helpers/buy/add-buy-order");
var ActivityHelper = require("../../helpers/activity/add");
var ActivityUpdateHelper = require("../../helpers/activity/update");
var moment = require('moment');
var TradingFees = require("../../helpers/wallet/get-trading-fees");
var TradeAdd = require("../../helpers/trade/add");
var sellUpdate = require("../../helpers/sell/update");
var sellDelete = require("../../helpers/sell/delete-order");
var UserNotifications = require("../../models/UserNotifications");
var Helper = require("../../helpers/helpers");
var Users = require("../../models/UsersModel");
var socketHelper = require("../../helpers/sockets/emit-trades");
var RefferalHelper = require("../get-refffered-amount");
var fiatValueHelper = require("../get-fiat-value");

var limitData = async (buyLimitOrderData, crypto, currency, activity, res = null, crypto_coin_id = null, currency_coin_id = null) => {
    try {
        var quantityValue = buyLimitOrderData.quantity;
        var userIds = [];
        userIds.push(buyLimitOrderData.user_id);
        if (buyLimitOrderData.orderQuantity <= 0) {
            return {
                status: 3,
                message: 'Invalid Quantity'
            }
        }
        let wallet = await WalletBalanceHelper.getWalletBalance(buyLimitOrderData.settle_currency, buyLimitOrderData.currency, buyLimitOrderData.user_id);
        let sellBook = await SellBookHelper.sellOrderBook(crypto, currency);
        // console.log("sellBook", sellBook)
        // let fees = await MakerTakerFees.getFeesValue(crypto, currency);
        var tradeOrder;
        if (buyLimitOrderData.order_type == "StopLimit") {
            const checkUser = Helper.checkWhichUser(buyLimitOrderData.user_id);
            if (checkUser == true) {
                buyLimitOrderData.placed_by = process.env.TRADEDESK_MANUAL
            } else {
                buyLimitOrderData.placed_by = process.env.TRADEDESK_USER
            }
        }
        if (sellBook && sellBook.length > 0) {
            if ((sellBook[0].price <= buyLimitOrderData.limit_price) || (sellBook[0].price <= buyLimitOrderData.stop_price)) {
                console.log("INSIDE IF")
                if (sellBook[0].quantity >= buyLimitOrderData.quantity) {
                    console.log("INSIDE SECOND IF")
                    var availableQuantity = sellBook[0].quantity;
                    buyLimitOrderData.fill_price = sellBook[0].price;
                    delete buyLimitOrderData.id;
                    console.log((buyLimitOrderData.fill_price * buyLimitOrderData.quantity).toFixed(8) <= (wallet.placed_balance).toFixed(8))
                    if (((buyLimitOrderData.fill_price * buyLimitOrderData.quantity) <= (wallet.placed_balance)) || buyLimitOrderData.placed_by == process.env.TRADEDESK_BOT || buyLimitOrderData.placed_by == process.env.TRADEDESK_MANUAL) {
                        console.log("buyLimitOrderData", buyLimitOrderData)
                        var buyAddedData = {
                            ...buyLimitOrderData
                        }
                        buyAddedData.is_partially_fulfilled = true;
                        var trade_history_data = {
                            ...buyLimitOrderData
                        }
                        console.log(trade_history_data)
                        console.log("buyLimitOrderData.quantity >= sellBook[0].quantity", buyLimitOrderData.quantity >= sellBook[0].quantity)
                        if (buyLimitOrderData.quantity >= sellBook[0].quantity) {
                            trade_history_data.fix_quantity = sellBook[0].quantity
                        } else {
                            trade_history_data.fix_quantity = buyLimitOrderData.quantity
                        }
                        console.log("trade_history_data", trade_history_data)
                        trade_history_data.maker_fee = 0.0;
                        trade_history_data.taker_fee = 0.0;
                        trade_history_data.requested_user_id = sellBook[0].user_id;
                        trade_history_data.created_at = new Date();
                        console.log("trade_history_data", trade_history_data)
                        let updatedActivity = await ActivityUpdateHelper.updateActivityData(sellBook[0].activity_id, trade_history_data);

                        userIds.push(parseInt(trade_history_data.requested_user_id));
                        var request = {
                            requested_user_id: trade_history_data.requested_user_id,
                            user_id: trade_history_data.user_id,
                            currency: buyLimitOrderData.currency,
                            side: buyLimitOrderData.side,
                            settle_currency: buyLimitOrderData.settle_currency,
                            quantity: buyLimitOrderData.quantity,
                            fill_price: buyLimitOrderData.fill_price,
                            crypto_coin_id,
                            currency_coin_id
                        }
                        var tradingFees = await TradingFees.getTraddingFees(request);

                        trade_history_data.user_fee = tradingFees.userFee;
                        trade_history_data.requested_fee = tradingFees.requestedFee;
                        trade_history_data.user_coin = buyLimitOrderData.settle_currency;
                        trade_history_data.requested_coin = buyLimitOrderData.currency;
                        trade_history_data.maker_fee = getTraddingFees.maker_fee;
                        trade_history_data.taker_fee = getTraddingFees.taker_fee;
                        trade_history_data.fiat_values = await fiatValueHelper.getFiatValue(crypto, currency);

                        if (trade_history_data.activity_id) {
                            delete trade_history_data.activity_id;
                        }
                        var tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                        tradeOrder = tradeHistory;
                        var remainigQuantity = availableQuantity - quantityValue;
                        if (remainigQuantity > 0) {
                            let updatedSellBook = await sellUpdate.updateSellBook(sellBook[0].id, {
                                quantity: remainigQuantity
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
                            await sellDelete.deleteSellOrder(sellBook[0].id);
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
                    console.log("INSIDE ELSE")
                    var remainigQuantity = buyLimitOrderData.quantity - sellBook[0].quantity;
                    remainigQuantity = parseFloat(remainigQuantity).toFixed(8);
                    console.log("remainigQuantity", remainigQuantity)
                    // var feeResult = await MakerTakerFees.getFeesValue(buyLimitOrderData.settle_currency, buyLimitOrderData.currency);
                    if (((buyLimitOrderData.fill_price * buyLimitOrderData.quantity) <= (wallet.placed_balance)) || buyLimitOrderData.placed_by == process.env.TRADEDESK_BOT || buyLimitOrderData.placed_by == process.env.TRADEDESK_MANUAL) {
                        console.log("INSIDE IF WALLET CHECKING");
                        var buyAddedData = {
                            ...buyLimitOrderData
                        }
                        buyAddedData.is_partially_fulfilled = true;
                        var resendData = {
                            ...buyLimitOrderData
                        };
                        sellBook[0].quantity = (sellBook[0].quantity).toFixed(3);
                        sellBook[0].price = (sellBook[0].price).toFixed(5);

                        buyLimitOrderData.quantity = sellBook[0].quantity;
                        buyLimitOrderData.order_status = "partially_filled";
                        buyLimitOrderData.fill_price = sellBook[0].price;

                        var deleteResult = await sellDelete.deleteSellOrder(sellBook[0].id)
                        delete buyLimitOrderData.id;
                        var trade_history_data = {
                            ...buyLimitOrderData
                        };
                        if (buyLimitOrderData.quantity >= sellBook[0].quantity) {
                            trade_history_data.fix_quantity = sellBook[0].quantity;
                        } else {
                            trade_history_data.fix_quantity = buyLimitOrderData.quantity;
                        }

                        trade_history_data.maker_fee = 0.0;
                        trade_history_data.taker_fee = 0.0;
                        trade_history_data.quantity = sellBook[0].quantity;
                        trade_history_data.requested_user_id = sellBook[0].user_id;
                        trade_history_data.created_at = new Date();

                        var activityResult = await ActivityUpdateHelper.updateActivityData(sellBook[0].activity_id, trade_history_data);
                        console.log("activityResult", activityResult)
                        var request = {
                            requested_user_id: trade_history_data.requested_user_id,
                            user_id: trade_history_data.user_id,
                            currency: buyLimitOrderData.currency,
                            side: buyLimitOrderData.side,
                            settle_currency: buyLimitOrderData.settle_currency,
                            quantity: sellBook[0].quantity,
                            fill_price: buyLimitOrderData.fill_price,
                            crypto_coin_id,
                            currency_coin_id
                        }

                        var tradingFees = await TradingFees.getTraddingFees(request);
                        trade_history_data.user_fee = (tradingFees.userFee);
                        trade_history_data.requested_fee = (tradingFees.requestedFee);
                        trade_history_data.user_coin = crypto;
                        trade_history_data.requested_coin = currency;
                        trade_history_data.maker_fee = tradingFees.maker_fee;
                        trade_history_data.taker_fee = tradingFees.taker_fee;
                        trade_history_data.fiat_values = await fiatValueHelper.getFiatValue(crypto, currency);

                        if (trade_history_data.activity_id) {
                            delete trade_history_data.activity_id;
                        }

                        console.log("trade_history_data", trade_history_data)

                        let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                        tradeOrder = tradeHistory;
                        await sellDelete.deleteSellOrder(sellBook[0].id);
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
                            ...buyLimitOrderData
                        }

                        resendDataLimit.quantity = remainigQuantity;
                        resendDataLimit.activity_id = activityResult.id;

                        console.log("resendDataLimit", resendDataLimit);
                        console.log("resendDataLimit, resendData.settle_currency, resendData.currency, activityResult", resendDataLimit, resendData.settle_currency, resendData.currency, activityResult)

                        if (remainigQuantity > 0) {
                            var responseData = await module.exports.limitData(resendDataLimit, resendData.settle_currency, resendData.currency, activityResult, res, crypto_coin_id, currency_coin_id);
                            return responseData;
                        }
                    } else {
                        return {
                            status: 3,
                            message: 'Insufficient balance to place order'
                        }
                    }
                }
                // Check for referral
                let referredData = await RefferalHelper.getAmount(tradeOrder, tradeOrder.user_id, tradeOrder.id);
            } else {
                console.log("INSIDE ELSE", buyLimitOrderData)
                if ((buyLimitOrderData.quantity * buyLimitOrderData.limit_price).toFixed(8) <= (wallet.placed_balance).toFixed(8) || buyLimitOrderData.placed_by == process.env.TRADEDESK_BOT || buyLimitOrderData.placed_by == process.env.TRADEDESK_MANUAL) {
                    var buyAddedData = {
                        ...buyLimitOrderData
                    };
                    buyAddedData.fix_quantity = buyAddedData.quantity;
                    buyAddedData.maker_fee = 0.0;
                    buyAddedData.taker_fee = 0.0;
                    if (buyAddedData.order_type == "StopLimit") {
                        buyAddedData.order_type = "Limit";
                        buyAddedData.price = buyLimitOrderData.limit_price;
                    }
                    delete buyAddedData.id;
                    delete buyAddedData.side;
                    delete buyAddedData.activity_id;
                    buyAddedData.side = "Buy";
                    console.log("buyAddedData", buyAddedData)
                    var activity = await ActivityHelper.addActivityData(buyAddedData);
                    console.log("activity", activity)
                    buyAddedData.is_partially_fulfilled = true;
                    buyLimitOrderData.is_filled = false;
                    buyAddedData.activity_id = activity.id;
                    buyLimitOrderData.added = true;
                    var addBuyBook = await BuyAdd.addBuyBookData(buyAddedData);
                    console.log(addBuyBook)
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
                        message: 'Order Partially Fulfilled and Added to Buy Book'
                    }
                } else {
                    // Insufficent Funds Error
                    return {
                        status: 3,
                        message: 'Insufficient balance to place order'
                    }
                }
            }
        } else {
            if ((buyLimitOrderData.quantity * buyLimitOrderData.limit_price).toFixed(8) <= (wallet.placed_balance).toFixed(8) || buyLimitOrderData.placed_by == process.env.TRADEDESK_BOT || buyLimitOrderData.placed_by == process.env.TRADEDESK_MANUAL) {
                var buyAddedData = {
                    ...buyLimitOrderData
                };
                // buyAddedData.price = buyLimitOrderData.limit_price;
                buyAddedData.fix_quantity = buyAddedData.quantity;
                buyAddedData.maker_fee = 0.0;
                buyAddedData.taker_fee = 0.0;
                delete buyAddedData.id;
                delete buyAddedData.side;
                delete buyAddedData.activity_id;
                buyAddedData.side = "Buy";
                if (buyAddedData.order_type == "StopLimit") {
                    buyAddedData.order_type = "Limit";
                    buyAddedData.price = buyLimitOrderData.limit_price;
                }
                var activity = await ActivityHelper.addActivityData(buyAddedData);
                buyAddedData.is_partially_fulfilled = true;
                buyLimitOrderData.is_filled = false;
                buyAddedData.activity_id = activity.id;
                buyLimitOrderData.added = true;
                var addBuyBook = await BuyAdd.addBuyBookData(buyAddedData);

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
                    message: 'Order Palce Success'
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
    limitData
}