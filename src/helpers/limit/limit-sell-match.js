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
var PairsModel = require("../../models/Pairs");
var Helper = require("../../helpers/helpers");
var Users = require("../../models/UsersModel");
var socketHelper = require("../../helpers/sockets/emit-trades");
var RefferalHelper = require("../get-refffered-amount");
var fiatValueHelper = require("../get-fiat-value");

var limitSellData = async (sellLimitOrderData, crypto, currency, activity, res = null, crypto_coin_id = null, currency_coin_id = null, allOrderData = []) => {
    try {
        var pairDetails = await PairsModel
            .query()
            .first()
            .select("name", "quantity_precision", "price_precision")
            .where("deleted_at", null)
            .andWhere("name", sellLimitOrderData.symbol)
            .orderBy("id", "DESC")
        var quantityValue = parseFloat(sellLimitOrderData.quantity).toFixed(pairDetails.quantity_precision);
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
                    sellLimitOrderData.fill_price = parseFloat(buyBook[0].price).toFixed(pairDetails.price_precision);
                    delete sellLimitOrderData.id;
                    var sellAddedData = {
                        ...sellLimitOrderData
                    }
                    sellAddedData.is_partially_fulfilled = true;
                    var trade_history_data = {
                        ...sellLimitOrderData
                    }
                    trade_history_data.fix_quantity = parseFloat(quantityValue).toFixed(pairDetails.quantity_precision);
                    trade_history_data.quantity = parseFloat(sellLimitOrderData.quantity).toFixed(pairDetails.quantity_precision)
                    trade_history_data.maker_fee = 0.0;
                    trade_history_data.taker_fee = 0.0;
                    trade_history_data.requested_user_id = buyBook[0].user_id;
                    trade_history_data.created_at = new Date();
                    if (buyBook[0].is_stop_limit == true) {
                        trade_history_data.is_stop_limit = true
                    }
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
                    // trade_history_data.txn_group_id = txnGroupId;
                    if (trade_history_data.activity_id)
                        delete trade_history_data.activity_id;
                    var tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                    tradeOrder = tradeHistory;
                    allOrderData.push(tradeHistory);
                    var remainningQuantity = availableQuantity - quantityValue;
                    if (remainningQuantity > 0) {
                        let updateBuyBook = await buyUpdate.updateBuyBook(buyBook[0].id, {
                            quantity: parseFloat(remainningQuantity).toFixed(pairDetails.quantity_precision)
                        });

                        var userData = userIds;
                        var tradeData = allOrderData;
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
                                                templateSlug: "trade_partially_filled",
                                                email: user_data.email,
                                                user_detail: user_data,
                                                formatData: {
                                                    recipientName: user_data.first_name,
                                                    side: side,
                                                    pair: symbol,
                                                    order_type: order_type,
                                                    quantity: orderQuantity,
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

                        //Emit data in rooms
                        let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                        // Email Data
                        let emailData = {
                            userIds: userIds,
                            orderData: allOrderData
                        }
                        return {
                            status: 1,
                            message: '',
                            tradeData: emailData
                        }
                    } else {
                        await buyDelete.deleteOrder(buyBook[0].id);

                        var userData = userIds;
                        var tradeData = allOrderData;
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
                                                templateSlug: "trade_partially_filled",
                                                email: user_data.email,
                                                user_detail: user_data,
                                                formatData: {
                                                    recipientName: user_data.first_name,
                                                    side: side,
                                                    pair: symbol,
                                                    order_type: order_type,
                                                    quantity: orderQuantity,
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

                        //Emit data in rooms
                        let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                        // Email Data
                        let emailData = {
                            userIds: userIds,
                            orderData: allOrderData
                        }
                        return {
                            status: 1,
                            message: '',
                            tradeData: emailData
                        }
                    }
                } else {
                    console.log("ELSE", remainningQuantity)
                    var remainningQuantity = sellLimitOrderData.quantity - buyBook[0].quantity;
                    remainningQuantity = parseFloat(remainningQuantity).toFixed(pairDetails.quantity_precision);
                    var sellAddedData = {
                        ...sellLimitOrderData
                    }
                    sellAddedData.is_partially_fulfilled = true;
                    var resendData = {
                        ...sellLimitOrderData
                    }
                    buyBook[0].quantity = parseFloat(buyBook[0].quantity).toFixed(pairDetails.quantity_precision);
                    buyBook[0].price = parseFloat(buyBook[0].price).toFixed(pairDetails.price_precision);

                    var flag = false;
                    if (buyBook[0].is_stop_limit == true) {
                        flag = true
                    }
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
                    trade_history_data.quantity = parseFloat(buyBook[0].quantity).toFixed(pairDetails.quantity_precision);
                    trade_history_data.requested_user_id = buyBook[0].user_id;
                    trade_history_data.created_at = new Date();
                    trade_history_data.is_stop_limit = flag;
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
                    // trade_history_data.txn_group_id = txnGroupId;
                    if (trade_history_data.activity_id)
                        delete trade_history_data.activity_id;
                    console.log(JSON.stringify(trade_history_data))

                    var tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                    tradeOrder = tradeHistory;
                    allOrderData.push(tradeHistory);
                    await buyDelete.deleteOrder(buyBook[0].id);

                    //Emit data in rooms
                    let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)

                    var resendDataLimit = {
                        ...sellLimitOrderData
                    }

                    resendDataLimit.quantity = parseFloat(remainningQuantity).toFixed(pairDetails.quantity_precision);
                    resendDataLimit.activity_id = activityResult.id;

                    if (remainningQuantity > 0) {
                        var responseData = await module.exports.limitSellData(resendDataLimit, resendDataLimit.settle_currency, resendDataLimit.currency, activityResult, res, crypto_coin_id, currency_coin_id, allOrderData);
                        return responseData
                    }
                }
                // Check for referral
                let referredData = await RefferalHelper.getAmount(tradeOrder, tradeOrder.user_id, tradeOrder.id);
            } else {
                console.log("sellLimitOrderData.quantity", sellLimitOrderData.quantity)
                if (allOrderData.length > 0) {
                    var userData = userIds;
                    var tradeData = allOrderData;
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
                                            templateSlug: "trade_partially_filled",
                                            email: user_data.email,
                                            user_detail: user_data,
                                            formatData: {
                                                recipientName: user_data.first_name,
                                                side: side,
                                                pair: symbol,
                                                order_type: order_type,
                                                quantity: orderQuantity,
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
                var sellAddedData = {
                    ...sellLimitOrderData
                }
                sellAddedData.fix_quantity = parseFloat(sellAddedData.quantity).toFixed(pairDetails.quantity_precision);
                sellAddedData.maker_fee = 0.0;
                sellAddedData.taker_fee = 0.0;
                delete sellAddedData.id;
                delete sellAddedData.side;
                delete sellAddedData.activity_id;
                sellAddedData.side = "Sell"
                if (sellAddedData.order_type == "StopLimit") {
                    sellAddedData.order_type = "Limit";
                    sellAddedData.price = parseFloat(sellLimitOrderData.limit_price).toFixed(pairDetails.price_precision);
                    sellAddedData.is_stop_limit = true;
                }
                var activity = await ActivityHelper.addActivityData(sellAddedData);
                sellAddedData.is_partially_fulfilled = true;
                sellLimitOrderData.is_filled = false;
                sellAddedData.activity_id = activity.id;
                sellLimitOrderData.added = true;
                var addSellBook = await SellAdd.SellOrderAdd(sellAddedData, crypto_coin_id);

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
                                        templateSlug: "trade_place",
                                        email: user_data.email,
                                        user_detail: user_data,
                                        formatData: {
                                            recipientName: user_data.first_name,
                                            side: sellLimitOrderData.side,
                                            pair: sellLimitOrderData.symbol,
                                            order_type: sellLimitOrderData.order_type,
                                            quantity: sellLimitOrderData.quantity,
                                            price: sellLimitOrderData.limit_price,
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
                // Email Data
                let emailData = {
                    userIds: userIds,
                    orderData: allOrderData
                }
                return {
                    status: 2,
                    message: 'Order Partially Fulfilled and Added to Sell Book',
                    tradeData: emailData
                }
            }
        } else {
            console.log("sellLimitOrderData.quantity", sellLimitOrderData.quantity)
            if (allOrderData.length > 0) {
                var userData = userIds;
                var tradeData = allOrderData;
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
                                        templateSlug: "trade_partially_filled",
                                        email: user_data.email,
                                        user_detail: user_data,
                                        formatData: {
                                            recipientName: user_data.first_name,
                                            side: side,
                                            pair: symbol,
                                            order_type: order_type,
                                            quantity: orderQuantity,
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
            var sellAddedData = {
                ...sellLimitOrderData
            }
            sellAddedData.fix_quantity = parseFloat(sellAddedData.quantity).toFixed(pairDetails.quantity_precision);
            sellAddedData.maker_fee = 0.0;
            sellAddedData.taker_fee = 0.0;
            delete sellAddedData.id;
            delete sellAddedData.side;
            delete sellAddedData.activity_id;
            sellAddedData.side = "Sell"
            if (sellAddedData.order_type == "StopLimit") {
                sellAddedData.order_type = "Limit";
                sellAddedData.price = parseFloat(sellLimitOrderData.limit_price).toFixed(pairDetails.price_precision);
                sellAddedData.is_stop_limit = true;
            }
            var activity = ActivityHelper.addActivityData(sellAddedData);
            sellAddedData.is_partially_fulfilled = true;
            sellLimitOrderData.is_filled = false;
            sellAddedData.activity_id = activity.id;
            sellLimitOrderData.added = true;
            var addSellBook = await SellAdd.SellOrderAdd(sellAddedData, crypto_coin_id);

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
                                    templateSlug: "trade_place",
                                    email: user_data.email,
                                    user_detail: user_data,
                                    formatData: {
                                        recipientName: user_data.first_name,
                                        side: sellLimitOrderData.side,
                                        pair: sellLimitOrderData.symbol,
                                        order_type: sellLimitOrderData.order_type,
                                        quantity: sellLimitOrderData.quantity,
                                        price: sellLimitOrderData.limit_price,
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
            // Email Data
            let emailData = {
                userIds: userIds,
                orderData: allOrderData
            }
            return {
                status: 2,
                message: 'Order Partially Fulfilled and Added to Sell Book',
                tradeData: emailData
            }
        }
    } catch (error) {
        console.log(JSON.stringify(error));
    }
}

module.exports = {
    limitSellData
}