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
var PairsModel = require("../../models/Pairs");
var PendingOrderExecutuionModel = require("../../models/PendingOrdersExecutuions");
var Helper = require("../../helpers/helpers");
var Users = require("../../models/UsersModel");
var socketHelper = require("../../helpers/sockets/emit-trades");
var RefferalHelper = require("../get-refffered-amount");
var fiatValueHelper = require("../get-fiat-value");

var i18n = require("i18n");
var WalletModel = require("../../models/Wallet");
var addCancel = require("../activity/add-cancel-activity");


var cancelPendinOrder = require("../pending/cancel-pending-data");

// Influx setup
const Influx = require('influx');
const influx = new Influx.InfluxDB({
    host: process.env.INFLUX_HOST,
    port: process.env.INFLUX_PORT,
    database: process.env.INFLUX_DATABASE,
    username: process.env.INFLUX_USERNAME,
    password: process.env.INFLUX_PASSWORD,
    schema: [
        {
            measurement: 'trade_history_xrp_btc',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        }
    ]
})


var limitData = async (buyLimitOrderData, crypto, currency, activity, res = null, crypto_coin_id = null, currency_coin_id = null, allOrderData = [], originalQuantityValue = 0, pending_order_id = 0.0, is_checkbox_enabled = false) => {
    try {

        if (pending_order_id != 0) {
            var getPendingData = await PendingOrderExecutuionModel
                .query()
                .first()
                .select("is_cancel")
                .where("id", pending_order_id)
                .andWhere("deleted_at", null)
                .orderBy("id", "DESC");

            if (getPendingData != undefined) {
                var getData = await PendingOrderExecutuionModel
                    .query()
                    .where("id", pending_order_id)
                    .andWhere("deleted_at", null)
                    .patch({
                        is_executed: true
                    })
            }
        }

        // console.log(buyLimitOrderData, crypto, currency, activity, res, crypto_coin_id, currency_coin_id, allOrderData, originalQuantityValue, pending_order_id)
        var pairDetails = await PairsModel
            .query()
            .first()
            .select("name", "quantity_precision", "price_precision", "influx_table_name", "influx_pair_name")
            .where("deleted_at", null)
            .andWhere("name", buyLimitOrderData.symbol)
            .orderBy("id", "DESC");
        // console.log("pairDetails", pairDetails)

        var quantityValue = parseFloat(buyLimitOrderData.quantity).toFixed(pairDetails.quantity_precision);
        if (allOrderData.length == 0) {
            originalQuantityValue = parseFloat(buyLimitOrderData.quantity).toFixed(pairDetails.quantity_precision)
        }
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

        var checkSelfExecution = false;

        if (buyLimitOrderData.user_id == process.env.TRADEDESK_USER_ID && is_checkbox_enabled == false) {
            checkSelfExecution = true;
        }

        console.log("sellBook.length", sellBook.length)
        // console.log("sellBook[0].user_id == buyLimitOrderData.user_id", sellBook[0].user_id == buyLimitOrderData.user_id)
        // console.log("checkSelfExecution", checkSelfExecution)

        if (sellBook && sellBook.length > 0) {
            if (sellBook[0].user_id == buyLimitOrderData.user_id && checkSelfExecution == false && (buyLimitOrderData.order_type == "Limit") ? (sellBook[0].limit_price <= buyLimitOrderData.limit_price) : (sellBook[0].limit_price <= buyLimitOrderData.stop_price && sellBook[0].limit_price <= buyLimitOrderData.limit_price)) {
                console.log("INSIDE IF")
                console.log("sellBook[0].quantity > buyLimitOrderData.quantity", sellBook[0].quantity > buyLimitOrderData.quantity)
                console.log("sellBook[0].quantity == buyLimitOrderData.quantity", sellBook[0].quantity == buyLimitOrderData.quantity)
                console.log("sellBook[0].quantity < buyLimitOrderData.quantity", sellBook[0].quantity < buyLimitOrderData.quantity)
                if (sellBook[0].quantity > buyLimitOrderData.quantity) {
                    console.log("INSIDE FIRST IF")
                    var selfRemainningQuantity = parseFloat(sellBook[0].quantity) - parseFloat(buyLimitOrderData.quantity);
                    console.log("selfRemainningQuantity", selfRemainningQuantity)
                    var orderData = {
                        quantity: selfRemainningQuantity
                    }
                    console.log("orderData", orderData)
                    console.log("sellBook[0].activity_id", sellBook[0].activity_id)
                    let updatedActivity = await ActivityUpdateHelper.updateActivityData(sellBook[0].activity_id, orderData);

                    var orderValue = {
                        ...buyLimitOrderData
                    }

                    orderValue.quantity = sellLimitOrderData.quantity;
                    orderValue.is_cancel = true;
                    orderValue.reason = "Self Execution Order"

                    var addCancelActivity = await addCancel.addActivityData(orderValue)

                    var updateUserBalance = await WalletModel
                        .query()
                        .first()
                        .select()
                        .where("deleted_at", null)
                        .andWhere("user_id", buyLimitOrderData.user_id)
                        .andWhere("coin_id", crypto_coin_id)
                        .orderBy("id", "DESC");
                    if (updateUserBalance != undefined) {
                        var updateBalance = await WalletModel
                            .query()
                            .where("deleted_at", null)
                            .andWhere("user_id", buyLimitOrderData.user_id)
                            .andWhere("coin_id", crypto_coin_id)
                            .patch({
                                'placed_balance': parseFloat(updateUserBalance.placed_balance) + parseFloat(buyLimitOrderData.quantity)
                            })
                    }
                    let updatedSellBook = await sellUpdate.updateSellBook(sellBook[0].id, {
                        quantity: parseFloat(selfRemainningQuantity).toFixed(pairDetails.quantity_precision)
                    });

                    console.log("pending_order_id", pending_order_id)

                    if (pending_order_id != 0) {
                        var getPendingData = await PendingOrderExecutuionModel
                            .query()
                            .first()
                            .select("is_cancel")
                            .where("id", pending_order_id)
                            .andWhere("deleted_at", null)
                            .orderBy("id", "DESC");

                        if (getPendingData != undefined) {
                            var getData = await PendingOrderExecutuionModel
                                .query()
                                .where("id", pending_order_id)
                                .andWhere("deleted_at", null)
                                .patch({
                                    is_executed: true,
                                    reason: "Self Order Execution"
                                })
                        }
                    }

                    console.log("allOrderData.length", allOrderData.length)

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
                                    var allData = {
                                        template: "emails/general_mail.ejs",
                                        templateSlug: "trade_partially_filled",
                                        email: user_data.email,
                                        user_detail: user_data,
                                        formatData: {
                                            recipientName: user_data.first_name,
                                            side: tradeData[0].side,
                                            pair: tradeData[0].symbol,
                                            order_type: tradeData[0].order_type,
                                            originalQuantity: originalQuantityValue,
                                            allTradeData: tradeData
                                        }

                                    }
                                    if (userNotification.email == true || userNotification.email == "true") {
                                        if (user_data.email != undefined) {
                                            await Helper.SendEmail(res, allData)
                                        }
                                    }
                                    if (userNotification.text == true || userNotification.text == "true") {
                                        if (user_data.phone_number != undefined) {
                                            await Helper.sendSMS(allData)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    console.log("buyLimitOrderData.user_id", buyLimitOrderData.user_id)

                    var userNotification = await UserNotifications.getSingleData({
                        user_id: buyLimitOrderData.user_id,
                        deleted_at: null,
                        slug: 'trade_execute'
                    })
                    var user_data = await Users.getSingleData({
                        deleted_at: null,
                        id: buyLimitOrderData.user_id,
                        is_active: true
                    });

                    console.log("user_data", userNotification)
                    console.log("user_data != undefined", user_data != undefined)
                    console.log("userNotification != undefined", userNotification != undefined)

                    if (user_data != undefined) {
                        if (userNotification != undefined) {
                            console.log("INSIDE NOTIFICATION")
                            var allData = {
                                template: "emails/general_mail.ejs",
                                templateSlug: "order_failed",
                                email: user_data.email,
                                user_detail: user_data,
                                formatData: {
                                    recipientName: user_data.first_name,
                                    reason: i18n.__("Self Order Execution").message
                                }
                            }

                            console.log("allData", allData)

                            console.log("userNotification.email", userNotification.email)
                            if (userNotification.email == true || userNotification.email == "true") {
                                if (user_data.email != undefined) {
                                    await Helper.SendEmail(res, allData)
                                }
                            }
                            if (userNotification.text == true || userNotification.text == "true") {
                                if (user_data.phone_number != undefined) {
                                    await Helper.sendSMS(allData)
                                }
                            }
                        }
                    }

                    // Emit Socket Event
                    let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)

                    return {
                        status: 3,
                        message: 'Self Order Execution'
                    }

                } else if (sellBook[0].quantity == buyLimitOrderData.quantity) {
                    console.log("INSIDE SECOND IF")
                    var selfRemainningQuantity = parseFloat(sellBook[0].quantity) - parseFloat(buyLimitOrderData.quantity);
                    console.log("selfRemainningQuantity", selfRemainningQuantity)
                    if (selfRemainningQuantity == 0) {
                        var orderData = {
                            quantity: selfRemainningQuantity
                        }
                        console.log("orderData", orderData)
                        let updatedActivity = await ActivityUpdateHelper.updateActivityData(sellBook[0].activity_id, orderData, true);
                        var cancelPendingOrder = await cancelPendinOrder.cancelPendingOrder("Sell", "Limit", sellBook[0].id, true);

                        console.log("cancelPendingOrder", cancelPendingOrder)

                        console.log("pending_order_id", pending_order_id)

                        if (pending_order_id != 0) {
                            var getPendingData = await PendingOrderExecutuionModel
                                .query()
                                .first()
                                .select("is_cancel")
                                .where("id", pending_order_id)
                                .andWhere("deleted_at", null)
                                .orderBy("id", "DESC");

                            if (getPendingData != undefined) {
                                var getData = await PendingOrderExecutuionModel
                                    .query()
                                    .where("id", pending_order_id)
                                    .andWhere("deleted_at", null)
                                    .patch({
                                        is_executed: true,
                                        reason: "Self Execution Order"
                                    })
                            }

                        }

                        console.log("allOrderData.length", allOrderData.length)

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
                                        var allData = {
                                            template: "emails/general_mail.ejs",
                                            templateSlug: "trade_partially_filled",
                                            email: user_data.email,
                                            user_detail: user_data,
                                            formatData: {
                                                recipientName: user_data.first_name,
                                                side: tradeData[0].side,
                                                pair: tradeData[0].symbol,
                                                order_type: tradeData[0].order_type,
                                                originalQuantity: originalQuantityValue,
                                                allTradeData: tradeData
                                            }

                                        }
                                        if (userNotification.email == true || userNotification.email == "true") {
                                            if (user_data.email != undefined) {
                                                await Helper.SendEmail(res, allData)
                                            }
                                        }
                                        if (userNotification.text == true || userNotification.text == "true") {
                                            if (user_data.phone_number != undefined) {
                                                await Helper.sendSMS(allData)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        var userNotification = await UserNotifications.getSingleData({
                            user_id: buyLimitOrderData.user_id,
                            deleted_at: null,
                            slug: 'trade_execute'
                        })
                        var user_data = await Users.getSingleData({
                            deleted_at: null,
                            id: buyLimitOrderData.user_id,
                            is_active: true
                        });

                        if (user_data != undefined) {
                            if (userNotification != undefined) {
                                var allData = {
                                    template: "emails/general_mail.ejs",
                                    templateSlug: "order_failed",
                                    email: user_data.email,
                                    user_detail: user_data,
                                    formatData: {
                                        recipientName: user_data.first_name,
                                        reason: i18n.__("Self Order Execution").message
                                    }
                                }
                                if (userNotification.email == true || userNotification.email == "true") {
                                    if (user_data.email != undefined) {
                                        await Helper.SendEmail(res, allData)
                                    }
                                }
                                if (userNotification.text == true || userNotification.text == "true") {
                                    if (user_data.phone_number != undefined) {
                                        await Helper.sendSMS(allData)
                                    }
                                }
                            }
                        }
                    }

                    // Emit Socket Event
                    let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)

                    return {
                        status: 3,
                        message: 'Self Order Execution'
                    }

                } else if (sellBook[0].quantity < buyLimitOrderData.quantity) {
                    console.log("buyLimitOrderData.quantity", buyLimitOrderData.quantity);
                    console.log("sellBook[0].quantity", sellBook[0].quantity)
                    var selfRemainningQuantity = parseFloat(buyLimitOrderData.quantity) - parseFloat(sellBook[0].quantity);
                    console.log("selfRemainningQuantity", selfRemainningQuantity)
                    var orderData = {
                        quantity: sellBook[0].quantity
                    }

                    console.log("orderData", orderData)
                    var activityResult = await ActivityUpdateHelper.updateActivityData(sellBook[0].activity_id, orderData, true);

                    var buyRecurseData = {
                        ...buyLimitOrderData
                    }
                    delete buyLimitOrderData.quantity;
                    buyRecurseData.quantity = selfRemainningQuantity;
                    console.log("buyRecurseData", buyRecurseData)
                    var cancelPendingOrder = await cancelPendinOrder.cancelPendingOrder("Sell", "Limit", sellBook[0].id, true);
                    console.log("cancelPendingOrder", cancelPendingOrder)
                    console.log("pending_order_id", pending_order_id)

                    if (pending_order_id != 0) {
                        var getPendingData = await PendingOrderExecutuionModel
                            .query()
                            .first()
                            .select("is_cancel")
                            .where("id", pending_order_id)
                            .andWhere("deleted_at", null)
                            .orderBy("id", "DESC");

                        if (getPendingData != undefined) {
                            var getData = await PendingOrderExecutuionModel
                                .query()
                                .where("id", pending_order_id)
                                .andWhere("deleted_at", null)
                                .patch({
                                    is_executed: true,
                                    reason: "Self Execution Order"
                                })
                        }
                    }

                    console.log("selfRemainningQuantity", selfRemainningQuantity)

                    var userNotification = await UserNotifications.getSingleData({
                        user_id: buyLimitOrderData.user_id,
                        deleted_at: null,
                        slug: 'trade_execute'
                    })
                    var user_data = await Users.getSingleData({
                        deleted_at: null,
                        id: buyLimitOrderData.user_id,
                        is_active: true
                    });

                    if (user_data != undefined) {
                        if (userNotification != undefined) {
                            var allData = {
                                template: "emails/general_mail.ejs",
                                templateSlug: "order_failed",
                                email: user_data.email,
                                user_detail: user_data,
                                formatData: {
                                    recipientName: user_data.first_name,
                                    reason: i18n.__("Self Order Execution").message
                                }
                            }
                            if (userNotification.email == true || userNotification.email == "true") {
                                if (user_data.email != undefined) {
                                    await Helper.SendEmail(res, allData)
                                }
                            }
                            if (userNotification.text == true || userNotification.text == "true") {
                                if (user_data.phone_number != undefined) {
                                    await Helper.sendSMS(allData)
                                }
                            }
                        }
                    }

                    if (selfRemainningQuantity > 0) {
                        console.log("++++Order executing with more books");
                        var responseData = await module.exports.limitData(buyRecurseData, buyRecurseData.settle_currency, buyRecurseData.currency, activityResult, res, crypto_coin_id, currency_coin_id, allOrderData, originalQuantityValue, pending_order_id, is_checkbox_enabled);
                        return responseData;
                    }

                }
            }
        }
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
            if ((buyLimitOrderData.order_type == "Limit") ? (sellBook[0].price <= buyLimitOrderData.limit_price) : (sellBook[0].price <= buyLimitOrderData.stop_price && sellBook[0].price <= buyLimitOrderData.limit_price)) {
                // console.log("INSIDE IF")
                if (sellBook[0].quantity >= buyLimitOrderData.quantity) {
                    // console.log("INSIDE SECOND IF")
                    var availableQuantity = parseFloat(sellBook[0].quantity).toFixed(pairDetails.quantity_precision);
                    buyLimitOrderData.fill_price = parseFloat(sellBook[0].price).toFixed(pairDetails.price_precision);
                    delete buyLimitOrderData.id;
                    // console.log((buyLimitOrderData.fill_price * buyLimitOrderData.quantity).toFixed(8) <= (wallet.placed_balance).toFixed(8))
                    if (((buyLimitOrderData.fill_price * buyLimitOrderData.quantity) <= (wallet.placed_balance)) || buyLimitOrderData.placed_by == process.env.TRADEDESK_BOT || buyLimitOrderData.placed_by == process.env.TRADEDESK_MANUAL) {
                        // console.log("buyLimitOrderData", JSON.stringify(buyLimitOrderData))
                        var buyAddedData = {
                            ...buyLimitOrderData
                        }
                        buyAddedData.is_partially_fulfilled = true;
                        var trade_history_data = {
                            ...buyLimitOrderData
                        }
                        trade_history_data.fix_quantity = quantityValue;
                        // console.log(JSON.stringify(trade_history_data))
                        // console.log("buyLimitOrderData.quantity >= sellBook[0].quantity", buyLimitOrderData.quantity >= sellBook[0].quantity)

                        // console.log("trade_history_data", JSON.stringify(trade_history_data))
                        trade_history_data.maker_fee = 0.0;
                        trade_history_data.taker_fee = 0.0;
                        trade_history_data.requested_user_id = sellBook[0].user_id;
                        trade_history_data.created_at = new Date();
                        trade_history_data.quantity = parseFloat(buyLimitOrderData.quantity).toFixed(pairDetails.quantity_precision)
                        if (sellBook[0].is_stop_limit == true) {
                            trade_history_data.is_stop_limit = true;
                        }
                        console.log("trade_history_data", JSON.stringify(trade_history_data))
                        let updatedActivity = await ActivityUpdateHelper.updateActivityData(sellBook[0].activity_id, trade_history_data);

                        userIds.push(parseInt(trade_history_data.requested_user_id));
                        var request = {
                            requested_user_id: trade_history_data.requested_user_id,
                            user_id: trade_history_data.user_id,
                            currency: buyLimitOrderData.currency,
                            side: buyLimitOrderData.side,
                            settle_currency: buyLimitOrderData.settle_currency,
                            quantity: parseFloat(buyLimitOrderData.quantity).toFixed(pairDetails.quantity_precision),
                            fill_price: parseFloat(buyLimitOrderData.fill_price).toFixed(pairDetails.price_precision),
                            crypto_coin_id,
                            currency_coin_id
                        }

                        // console.log("request", request)

                        if (buyLimitOrderData.user_id == sellBook[0].user_id && buyLimitOrderData.user_id == process.env.TRADEDESK_USER_ID) {
                            var tradingFees = {
                                userFee: 0.0,
                                requestedFee: 0.0,
                                maker_fee: 0.0,
                                taker_fee: 0.0
                            }
                        } else {
                            var tradingFees = await TradingFees.getTraddingFees(request);
                        }

                        // console.log(tradingFees);

                        trade_history_data.user_fee = tradingFees.userFee;
                        trade_history_data.requested_fee = tradingFees.requestedFee;
                        trade_history_data.user_coin = buyLimitOrderData.settle_currency;
                        trade_history_data.requested_coin = buyLimitOrderData.currency;
                        trade_history_data.maker_fee = tradingFees.maker_fee;
                        trade_history_data.taker_fee = tradingFees.taker_fee;
                        trade_history_data.fiat_values = await fiatValueHelper.getFiatValue(crypto, currency);

                        if (trade_history_data.activity_id) {
                            delete trade_history_data.activity_id;
                        }
                        // console.log("BELOW DELETED")
                        // tradeHistory.txn_group_id = txnGroupId;
                        var tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                        if (pairDetails.influx_pair_name != null) {
                            await influx.writePoints([
                                {
                                    measurement: pairDetails.influx_table_name,
                                    tags: { pair: pairDetails.influx_pair_name },
                                    timestamp: moment(tradeHistory.created_at).valueOf() * 1000000,
                                    fields: {
                                        price: parseFloat(request.fill_price),
                                        amount: parseFloat(request.quantity)
                                    }
                                }])
                                .then(() => {
                                    // console.log('Added data to the Db');
                                });
                        }
                        // console.log("tradeHistory", tradeHistory)
                        allOrderData.push(tradeHistory)
                        tradeOrder = tradeHistory;
                        // console.log("tradeOrder", tradeOrder)
                        var remainigQuantity = availableQuantity - quantityValue;
                        // console.log("remainigQuantity", remainigQuantity)
                        if (remainigQuantity > 0) {
                            let updatedSellBook = await sellUpdate.updateSellBook(sellBook[0].id, {
                                quantity: parseFloat(remainigQuantity).toFixed(pairDetails.quantity_precision)
                            });
                            var userData = userIds;
                            var tradeData = allOrderData;

                            // console.log("pending_order_id", pending_order_id)

                            if (pending_order_id != 0) {
                                var getPendingData = await PendingOrderExecutuionModel
                                    .query()
                                    .first()
                                    .select("is_cancel")
                                    .where("id", pending_order_id)
                                    .andWhere("deleted_at", null)
                                    .orderBy("id", "DESC");

                                if (getPendingData != undefined) {
                                    var getData = await PendingOrderExecutuionModel
                                        .query()
                                        .where("id", pending_order_id)
                                        .andWhere("deleted_at", null)
                                        .patch({
                                            is_executed: true
                                        })
                                }
                            }

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
                                        var allData = {
                                            template: "emails/general_mail.ejs",
                                            templateSlug: "trade_partially_filled",
                                            email: user_data.email,
                                            user_detail: user_data,
                                            formatData: {
                                                recipientName: user_data.first_name,
                                                side: tradeData[0].side,
                                                pair: tradeData[0].symbol,
                                                order_type: tradeData[0].order_type,
                                                originalQuantity: originalQuantityValue,
                                                allTradeData: tradeData
                                            }

                                        }
                                        if (userNotification.email == true || userNotification.email == "true") {
                                            if (user_data.email != undefined) {
                                                await Helper.SendEmail(res, allData)
                                            }
                                        }
                                        if (userNotification.text == true || userNotification.text == "true") {
                                            if (user_data.phone_number != undefined) {
                                                await Helper.sendSMS(allData)
                                            }
                                        }
                                    }
                                }
                            }

                            //Emit data in rooms
                            let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                            let referredData = await RefferalHelper.getAmount(tradeOrder, tradeOrder.user_id, tradeOrder.id);
                            // console.log("referredData", referredData)
                            return {
                                status: 1,
                                message: 'Order Success',
                                data: {
                                    userIds: userIds,
                                    orderData: tradeOrder
                                }
                            }
                        } else {
                            await sellDelete.deleteSellOrder(sellBook[0].id);
                            var userData = userIds;
                            var tradeData = allOrderData;

                            if (pending_order_id != 0) {
                                var getPendingData = await PendingOrderExecutuionModel
                                    .query()
                                    .first()
                                    .select("is_cancel")
                                    .where("id", pending_order_id)
                                    .andWhere("deleted_at", null)
                                    .orderBy("id", "DESC");

                                if (getPendingData != undefined) {
                                    var getData = await PendingOrderExecutuionModel
                                        .query()
                                        .where("id", pending_order_id)
                                        .andWhere("deleted_at", null)
                                        .patch({
                                            is_executed: true
                                        })
                                }
                            }

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
                                        var allData = {
                                            template: "emails/general_mail.ejs",
                                            templateSlug: "trade_partially_filled",
                                            email: user_data.email,
                                            user_detail: user_data,
                                            formatData: {
                                                recipientName: user_data.first_name,
                                                side: tradeData[0].side,
                                                pair: tradeData[0].symbol,
                                                order_type: tradeData[0].order_type,
                                                originalQuantity: originalQuantityValue,
                                                allTradeData: tradeData
                                            }

                                        }
                                        if (userNotification.email == true || userNotification.email == "true") {
                                            if (user_data.email != undefined) {
                                                await Helper.SendEmail(res, allData)
                                            }
                                        }
                                        if (userNotification.text == true || userNotification.text == "true") {
                                            if (user_data.phone_number != undefined) {
                                                await Helper.sendSMS(allData)
                                            }
                                        }
                                    }
                                }
                            }
                            //Emit data in rooms
                            let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                            let referredData = await RefferalHelper.getAmount(tradeOrder, tradeOrder.user_id, tradeOrder.id);
                            return {
                                status: 1,
                                message: 'Order Success'
                            }
                        }
                    } else {

                        if (pending_order_id != 0) {
                            var getPendingData = await PendingOrderExecutuionModel
                                .query()
                                .first()
                                .select("is_cancel")
                                .where("id", pending_order_id)
                                .andWhere("deleted_at", null)
                                .orderBy("id", "DESC");

                            if (getPendingData != undefined) {
                                var getData = await PendingOrderExecutuionModel
                                    .query()
                                    .where("id", pending_order_id)
                                    .andWhere("deleted_at", null)
                                    .patch({
                                        is_executed: true
                                    })
                            }
                        }

                        if (allOrderData.length > 0) {
                            if (user_data != undefined) {
                                if (userNotification != undefined) {
                                    var allData = {
                                        template: "emails/general_mail.ejs",
                                        templateSlug: "trade_execute",
                                        email: user_data.email,
                                        user_detail: user_data,
                                        formatData: {
                                            recipientName: user_data.first_name,
                                            side: side,
                                            pair: symbol,
                                            order_type: order_type,
                                            quantity: originalQuantityValue,
                                            allTradeData: allOrderData
                                        }

                                    }
                                    if (userNotification.email == true || userNotification.email == "true") {
                                        if (user_data.email != undefined) {
                                            await Helper.SendEmail(res, allData)
                                        }
                                    }
                                    if (userNotification.text == true || userNotification.text == "true") {
                                        if (user_data.phone_number != undefined) {
                                            await Helper.sendSMS(allData)
                                        }
                                    }
                                }
                            }
                        }

                        var userNotification = await UserNotifications.getSingleData({
                            user_id: buyLimitOrderData.user_id,
                            deleted_at: null,
                            slug: 'trade_execute'
                        })
                        var user_data = await Users.getSingleData({
                            deleted_at: null,
                            id: buyLimitOrderData.user_id,
                            is_active: true
                        });
                        if (user_data != undefined) {
                            if (userNotification != undefined) {
                                var allData = {
                                    template: "emails/general_mail.ejs",
                                    templateSlug: "order_failed",
                                    email: user_data.email,
                                    user_detail: user_data,
                                    formatData: {
                                        recipientName: user_data.first_name,
                                        reason: i18n.__("Insufficient balance to place order").message
                                    }
                                }
                                if (userNotification.email == true || userNotification.email == "true") {
                                    if (user_data.email != undefined) {
                                        await Helper.SendEmail(res, allData)
                                    }
                                }
                                if (userNotification.text == true || userNotification.text == "true") {
                                    if (user_data.phone_number != undefined) {
                                        await Helper.sendSMS(allData)
                                    }
                                }
                            }
                        }
                        return {
                            status: 3,
                            message: 'Insufficient balance to place order'
                        }
                    }
                } else {
                    // console.log("=>If Order can be filled from different book");
                    // console.log("INSIDE ELSE")
                    var remainigQuantity = buyLimitOrderData.quantity - sellBook[0].quantity;
                    remainigQuantity = parseFloat(remainigQuantity).toFixed(pairDetails.quantity_precision);
                    // console.log("remainigQuantity", remainigQuantity)
                    // var feeResult = await MakerTakerFees.getFeesValue(buyLimitOrderData.settle_currency, buyLimitOrderData.currency);
                    if (((buyLimitOrderData.fill_price * buyLimitOrderData.quantity) <= (wallet.placed_balance)) || buyLimitOrderData.placed_by == process.env.TRADEDESK_BOT || buyLimitOrderData.placed_by == process.env.TRADEDESK_MANUAL) {
                        // console.log("INSIDE IF WALLET CHECKING");
                        var buyAddedData = {
                            ...buyLimitOrderData
                        }
                        buyAddedData.is_partially_fulfilled = true;
                        var resendData = {
                            ...buyLimitOrderData
                        };
                        sellBook[0].quantity = parseFloat(sellBook[0].quantity).toFixed(pairDetails.quantity_precision);
                        sellBook[0].price = parseFloat(sellBook[0].price).toFixed(pairDetails.price_precision);

                        var flag = false;
                        if (sellBook[0].is_stop_limit == true) {
                            flag = true;
                        }

                        buyLimitOrderData.quantity = parseFloat(sellBook[0].quantity).toFixed(pairDetails.quantity_precision);
                        buyLimitOrderData.order_status = "partially_filled";
                        buyLimitOrderData.fill_price = parseFloat(sellBook[0].price).toFixed(pairDetails.price_precision);

                        var deleteResult = await sellDelete.deleteSellOrder(sellBook[0].id)
                        delete buyLimitOrderData.id;
                        var trade_history_data = {
                            ...buyLimitOrderData
                        };
                        trade_history_data.fix_quantity = quantityValue;

                        trade_history_data.maker_fee = 0.0;
                        trade_history_data.taker_fee = 0.0;
                        trade_history_data.quantity = parseFloat(sellBook[0].quantity).toFixed(pairDetails.quantity_precision);
                        trade_history_data.requested_user_id = sellBook[0].user_id;
                        trade_history_data.created_at = new Date();
                        trade_history_data.flag = true;

                        var activityResult = await ActivityUpdateHelper.updateActivityData(sellBook[0].activity_id, trade_history_data);
                        // console.log("activityResult", JSON.stringify(activityResult))
                        var request = {
                            requested_user_id: trade_history_data.requested_user_id,
                            user_id: trade_history_data.user_id,
                            currency: buyLimitOrderData.currency,
                            side: buyLimitOrderData.side,
                            settle_currency: buyLimitOrderData.settle_currency,
                            quantity: parseFloat(sellBook[0].quantity).toFixed(pairDetails.quantity_precision),
                            fill_price: parseFloat(buyLimitOrderData.fill_price).toFixed(pairDetails.price_precision),
                            crypto_coin_id,
                            currency_coin_id
                        }

                        if (buyLimitOrderData.user_id == sellBook[0].user_id && buyLimitOrderData.user_id == process.env.TRADEDESK_USER_ID) {
                            var tradingFees = {
                                userFee: 0.0,
                                requestedFee: 0.0,
                                maker_fee: 0.0,
                                taker_fee: 0.0
                            }
                        } else {
                            var tradingFees = await TradingFees.getTraddingFees(request);
                        }

                        // console.log(tradingFees);

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

                        if (trade_history_data.flag == true) {
                            delete trade_history_data.flag
                        }

                        // console.log("trade_history_data", JSON.stringify(trade_history_data))
                        // tradeHistory.txn_group_id = txnGroupId;
                        let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                        if (pairDetails.influx_pair_name != null) {
                            await influx.writePoints([
                                {
                                    measurement: pairDetails.influx_table_name,
                                    tags: { pair: pairDetails.influx_pair_name },
                                    timestamp: moment(tradeHistory.created_at).valueOf() * 1000000,
                                    fields: {
                                        price: parseFloat(request.fill_price),
                                        amount: parseFloat(request.quantity)
                                    }
                                }])
                                .then(() => {
                                    // console.log('Added data to the Db');
                                });
                        }
                        allOrderData.push(tradeHistory)
                        tradeOrder = tradeHistory;

                        if (pending_order_id != 0) {
                            var getPendingData = await PendingOrderExecutuionModel
                                .query()
                                .first()
                                .select("is_cancel")
                                .where("id", pending_order_id)
                                .andWhere("deleted_at", null)
                                .orderBy("id", "DESC");

                            if (getPendingData != undefined) {
                                var getData = await PendingOrderExecutuionModel
                                    .query()
                                    .where("id", pending_order_id)
                                    .andWhere("deleted_at", null)
                                    .patch({
                                        is_executed: true
                                    })
                            }
                        }

                        await sellDelete.deleteSellOrder(sellBook[0].id);

                        //Emit data in rooms
                        let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                        var resendDataLimit = {
                            ...buyLimitOrderData
                        }

                        resendDataLimit.quantity = remainigQuantity;
                        resendDataLimit.activity_id = activityResult.id;

                        // console.log("resendDataLimit", JSON.stringify(resendDataLimit));
                        // console.log("resendDataLimit, resendData.settle_currency, resendData.currency, activityResult", resendDataLimit, resendData.settle_currency, resendData.currency, activityResult)

                        if (remainigQuantity > 0) {
                            // console.log("++++Order executing with more books");
                            var responseData = await module.exports.limitData(resendDataLimit, resendData.settle_currency, resendData.currency, activityResult, res, crypto_coin_id, currency_coin_id, allOrderData, originalQuantityValue, pending_order_id);
                            return responseData;
                        }
                    } else {
                        var userNotification = await UserNotifications.getSingleData({
                            user_id: buyLimitOrderData.user_id,
                            deleted_at: null,
                            slug: 'trade_execute'
                        })
                        var user_data = await Users.getSingleData({
                            deleted_at: null,
                            id: buyLimitOrderData.user_id,
                            is_active: true
                        });
                        if (user_data != undefined) {
                            if (userNotification != undefined) {
                                var allData = {
                                    template: "emails/general_mail.ejs",
                                    templateSlug: "order_failed",
                                    email: user_data.email,
                                    user_detail: user_data,
                                    formatData: {
                                        recipientName: user_data.first_name,
                                        reason: i18n.__("Insufficient balance to place order").message
                                    }
                                }
                                if (userNotification.email == true || userNotification.email == "true") {
                                    if (user_data.email != undefined) {
                                        await Helper.SendEmail(res, allData)
                                    }
                                }
                                if (userNotification.text == true || userNotification.text == "true") {
                                    if (user_data.phone_number != undefined) {
                                        await Helper.sendSMS(allData)
                                    }
                                }
                            }
                        }
                        return {
                            status: 3,
                            message: 'Insufficient balance to place order'
                        }
                    }
                }
                // Check for referral
                let referredData = await RefferalHelper.getAmount(tradeOrder, tradeOrder.user_id, tradeOrder.id);
            } else {
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
                                var allData = {
                                    template: "emails/general_mail.ejs",
                                    templateSlug: "trade_partially_filled",
                                    email: user_data.email,
                                    user_detail: user_data,
                                    formatData: {
                                        recipientName: user_data.first_name,
                                        side: tradeData[0].side,
                                        pair: tradeData[0].symbol,
                                        order_type: tradeData[0].order_type,
                                        originalQuantity: originalQuantityValue,
                                        allTradeData: tradeData
                                    }

                                }
                                if (userNotification.email == true || userNotification.email == "true") {
                                    if (user_data.email != undefined) {
                                        await Helper.SendEmail(res, allData)
                                    }
                                }
                                if (userNotification.text == true || userNotification.text == "true") {
                                    if (user_data.phone_number != undefined) {
                                        await Helper.sendSMS(allData)
                                    }
                                }
                            }
                        }
                    }
                }
                // console.log("INSIDE ELSE", JSON.stringify(buyLimitOrderData))
                if ((buyLimitOrderData.quantity * buyLimitOrderData.limit_price).toFixed(8) <= (wallet.placed_balance).toFixed(8) || buyLimitOrderData.placed_by == process.env.TRADEDESK_BOT || buyLimitOrderData.placed_by == process.env.TRADEDESK_MANUAL) {
                    var buyAddedData = {
                        ...buyLimitOrderData
                    };
                    buyAddedData.fix_quantity = parseFloat(buyAddedData.quantity).toFixed(pairDetails.quantity_precision);
                    buyAddedData.maker_fee = 0.0;
                    buyAddedData.taker_fee = 0.0;
                    if (buyAddedData.order_type == "StopLimit") {
                        buyAddedData.order_type = "Limit";
                        buyAddedData.price = parseFloat(buyLimitOrderData.limit_price).toFixed(pairDetails.price_precision);
                        buyAddedData.is_stop_limit = true;
                    }
                    delete buyAddedData.id;
                    delete buyAddedData.side;
                    delete buyAddedData.activity_id;
                    buyAddedData.side = "Buy";
                    // console.log("buyAddedData", JSON.stringify(buyAddedData))
                    var activity = await ActivityHelper.addActivityData(buyAddedData);
                    // console.log("activity", JSON.stringify(activity))
                    buyAddedData.is_partially_fulfilled = true;
                    buyLimitOrderData.is_filled = false;
                    buyAddedData.activity_id = activity.id;
                    buyLimitOrderData.added = true;
                    var addBuyBook = await BuyAdd.addBuyBookData(buyAddedData);
                    // console.log(JSON.stringify(addBuyBook))

                    if (pending_order_id != 0) {
                        var getPendingData = await PendingOrderExecutuionModel
                            .query()
                            .first()
                            .select("is_cancel")
                            .where("id", pending_order_id)
                            .andWhere("deleted_at", null)
                            .orderBy("id", "DESC");

                        if (getPendingData != undefined) {
                            var getData = await PendingOrderExecutuionModel
                                .query()
                                .where("id", pending_order_id)
                                .andWhere("deleted_at", null)
                                .patch({
                                    is_executed: true
                                })
                        }
                    }

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
                                var allData = {
                                    template: "emails/general_mail.ejs",
                                    templateSlug: "trade_place",
                                    email: user_data.email,
                                    user_detail: user_data,
                                    formatData: {
                                        recipientName: user_data.first_name,
                                        side: buyLimitOrderData.side,
                                        pair: buyLimitOrderData.symbol,
                                        order_type: buyLimitOrderData.order_type,
                                        quantity: buyLimitOrderData.quantity,
                                        price: buyLimitOrderData.limit_price,
                                    }
                                }
                                if (userNotification.email == true || userNotification.email == "true") {
                                    if (user_data.email != undefined) {
                                        // console.log("++++Order executed partially..");
                                        await Helper.SendEmail(res, allData)
                                    }
                                }
                                if (userNotification.text == true || userNotification.text == "true") {
                                    if (user_data.phone_number != undefined) {
                                        await Helper.sendSMS(allData)
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

                    var getPendingData = await PendingOrderExecutuionModel
                        .query()
                        .first()
                        .select("is_cancel")
                        .where("id", pending_order_id)
                        .andWhere("deleted_at", null)
                        .orderBy("id", "DESC");

                    if (getPendingData != undefined) {
                        var getData = await PendingOrderExecutuionModel
                            .query()
                            .where("id", pending_order_id)
                            .andWhere("deleted_at", null)
                            .patch({
                                is_executed: null
                            })
                    }

                    var userNotification = await UserNotifications.getSingleData({
                        user_id: buyLimitOrderData.user_id,
                        deleted_at: null,
                        slug: 'trade_execute'
                    })
                    var user_data = await Users.getSingleData({
                        deleted_at: null,
                        id: buyLimitOrderData.user_id,
                        is_active: true
                    });
                    if (user_data != undefined) {
                        if (userNotification != undefined) {
                            var allData = {
                                template: "emails/general_mail.ejs",
                                templateSlug: "order_failed",
                                email: user_data.email,
                                user_detail: user_data,
                                formatData: {
                                    recipientName: user_data.first_name,
                                    reason: i18n.__("Insufficient balance to place order").message
                                }
                            }
                            if (userNotification.email == true || userNotification.email == "true") {
                                if (user_data.email != undefined) {
                                    await Helper.SendEmail(res, allData)
                                }
                            }
                            if (userNotification.text == true || userNotification.text == "true") {
                                if (user_data.phone_number != undefined) {
                                    await Helper.sendSMS(allData)
                                }
                            }
                        }
                    }
                    // Insufficent Funds Error
                    return {
                        status: 3,
                        message: 'Insufficient balance to place order'
                    }
                }
            }
        } else {
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
                            var allData = {
                                template: "emails/general_mail.ejs",
                                templateSlug: "trade_partially_filled",
                                email: user_data.email,
                                user_detail: user_data,
                                formatData: {
                                    recipientName: user_data.first_name,
                                    side: tradeData[0].side,
                                    pair: tradeData[0].symbol,
                                    order_type: tradeData[0].order_type,
                                    originalQuantity: originalQuantityValue,
                                    allTradeData: tradeData
                                }

                            }
                            if (userNotification.email == true || userNotification.email == "true") {
                                if (user_data.email != undefined) {
                                    await Helper.SendEmail(res, allData)
                                }
                            }
                            if (userNotification.text == true || userNotification.text == "true") {
                                if (user_data.phone_number != undefined) {
                                    await Helper.sendSMS(allData)
                                }
                            }
                        }
                    }
                }
            }
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
                    buyAddedData.is_stop_limit = true;
                    // buyAddedData.side = "Buy";
                }
                var activity = await ActivityHelper.addActivityData(buyAddedData);
                // console.log("activity", activity)
                buyAddedData.is_partially_fulfilled = true;
                buyLimitOrderData.is_filled = false;
                buyAddedData.activity_id = activity.id;
                buyLimitOrderData.added = true;
                // console.log("buyAddedData", buyAddedData)
                var addBuyBook = await BuyAdd.addBuyBookData(buyAddedData);

                if (pending_order_id != 0) {
                    var getPendingData = await PendingOrderExecutuionModel
                        .query()
                        .first()
                        .select("is_cancel")
                        .where("id", pending_order_id)
                        .andWhere("deleted_at", null)
                        .orderBy("id", "DESC");

                    if (getPendingData != undefined) {
                        var getData = await PendingOrderExecutuionModel
                            .query()
                            .where("id", pending_order_id)
                            .andWhere("deleted_at", null)
                            .patch({
                                is_executed: true
                            })
                    }
                }

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
                            var allData = {
                                template: "emails/general_mail.ejs",
                                templateSlug: "trade_place",
                                email: user_data.email,
                                user_detail: user_data,
                                formatData: {
                                    recipientName: user_data.first_name,
                                    side: buyLimitOrderData.side,
                                    pair: buyLimitOrderData.symbol,
                                    order_type: buyLimitOrderData.order_type,
                                    quantity: buyLimitOrderData.quantity,
                                    price: buyLimitOrderData.limit_price,
                                }
                            }
                            if (userNotification.email == true || userNotification.email == "true") {
                                if (user_data.email != undefined) {
                                    // console.log("++++Order placed");
                                    await Helper.SendEmail(res, allData)
                                }
                            }
                            if (userNotification.text == true || userNotification.text == "true") {
                                if (user_data.phone_number != undefined) {
                                    await Helper.sendSMS(allData)
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

                var getPendingData = await PendingOrderExecutuionModel
                    .query()
                    .first()
                    .select("is_cancel")
                    .where("id", pending_order_id)
                    .andWhere("deleted_at", null)
                    .orderBy("id", "DESC");

                if (getPendingData != undefined) {
                    var getData = await PendingOrderExecutuionModel
                        .query()
                        .where("id", pending_order_id)
                        .andWhere("deleted_at", null)
                        .patch({
                            is_executed: null
                        })
                }
                var userNotification = await UserNotifications.getSingleData({
                    user_id: buyLimitOrderData.user_id,
                    deleted_at: null,
                    slug: 'trade_execute'
                })
                var user_data = await Users.getSingleData({
                    deleted_at: null,
                    id: buyLimitOrderData.user_id,
                    is_active: true
                });
                if (user_data != undefined) {
                    if (userNotification != undefined) {
                        var allData = {
                            template: "emails/general_mail.ejs",
                            templateSlug: "order_failed",
                            email: user_data.email,
                            user_detail: user_data,
                            formatData: {
                                recipientName: user_data.first_name,
                                reason: i18n.__("Insufficient balance to place order").message
                            }
                        }
                        if (userNotification.email == true || userNotification.email == "true") {
                            if (user_data.email != undefined) {
                                await Helper.SendEmail(res, allData)
                            }
                        }
                        if (userNotification.text == true || userNotification.text == "true") {
                            if (user_data.phone_number != undefined) {
                                await Helper.sendSMS(allData)
                            }
                        }
                    }
                }
                return {
                    status: 3,
                    message: 'Insufficient balance to place order'
                }
            }
        }
    } catch (error) {
        console.log((error));
    }
}

module.exports = {
    limitData
}