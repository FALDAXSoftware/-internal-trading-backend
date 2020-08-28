var SellWalletBalanceHelper = require("../wallet/get-sell-wallet-balance");
var BuyBookHelper = require("../buy/get-buy-book-order");
var ActivityHelper = require("../../helpers/activity/add");
var SellAdd = require("../sell/add-sell-order");
var ActivityUpdateHelper = require("../../helpers/activity/update");
var TradingFees = require("../../helpers/wallet/get-trading-fees");
var TradeAdd = require("../../helpers/trade/add");
var buyUpdate = require("../buy/update-buy-order");
var buyDelete = require("../buy/delete-order");
var UserNotifications = require("../../models/UserNotifications");
var PairsModel = require("../../models/Pairs")
var PendingOrderExecutuionModel = require("../../models/PendingOrdersExecutuions");
var Helper = require("../../helpers/helpers");
var Users = require("../../models/UsersModel");
var socketHelper = require("../../helpers/sockets/emit-trades");
var RefferalHelper = require("../get-refffered-amount");
var fiatValueHelper = require("../get-fiat-value");
var moment = require('moment');

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

var limitSellData = async (sellLimitOrderData, crypto, currency, activity, res = null, crypto_coin_id = null, currency_coin_id = null, allOrderData = [], originalQuantityValue = 0, pending_order_id = 0.0, is_checkbox_enabled = false) => {
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

        // console.log("pending_order_id", pending_order_id)
        var pairDetails = await PairsModel
            .query()
            .first()
            .select("name", "quantity_precision", "price_precision", "influx_table_name", "influx_pair_name")
            .where("deleted_at", null)
            .andWhere("name", sellLimitOrderData.symbol)
            .orderBy("id", "DESC")
        // console.log("pairDetails", pairDetails)
        var quantityValue = parseFloat(sellLimitOrderData.quantity).toFixed(pairDetails.quantity_precision);
        var userIds = [];
        userIds.push(parseInt(sellLimitOrderData.user_id));
        if (sellLimitOrderData.quantity <= 0) {
            return {
                status: 3,
                message: 'Invalid Quantity'
            }
        }

        if (allOrderData.length == 0) {
            originalQuantityValue = quantityValue
        }

        let buyBook = await BuyBookHelper.getBuyBookOrder(crypto, currency);
        let walletData = await SellWalletBalanceHelper.getSellWalletBalance(crypto, currency, sellLimitOrderData.user_id);
        if (sellLimitOrderData.user_id != process.env.TRADEDESK_USER_ID) {
            if (walletData.placed_balance < sellLimitOrderData.quantity) {
                var userNotification = await UserNotifications.getSingleData({
                    user_id: sellLimitOrderData.user_id,
                    deleted_at: null,
                    slug: 'trade_execute'
                })
                var user_data = await Users.getSingleData({
                    deleted_at: null,
                    id: sellLimitOrderData.user_id,
                    is_active: true
                });

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
                    message: "Insufficient balance to place order"
                }
            }
        }

        var checkSelfExecution = false;

        if (sellLimitOrderData.user_id == process.env.TRADEDESK_USER_ID && is_checkbox_enabled == false) {
            checkSelfExecution = true;
        }


        if (buyBook && buyBook.length > 0) {
            if (buyBook[0].user_id == sellLimitOrderData.user_id && checkSelfExecution == false && ((buyBook[0].order_type == "Limit") ? (buyBook[0].price >= sellLimitOrderData.limit_price) : (buyBook[0].price <= sellLimitOrderData.stop_price && buyBook[0].price >= sellLimitOrderData.limit_price))) {
                console.log("buyBook[0].user_id", buyBook[0].user_id);
                console.log("sellLimitOrderData.user_id", sellLimitOrderData.user_id);
                console.log("checkSelfExecution", checkSelfExecution)
                console.log("INSIDE IF")
                console.log("buyBook[0].quantity > sellLimitOrderData.quantity", buyBook[0].quantity > sellLimitOrderData.quantity)
                console.log("buyBook[0].quantity == sellLimitOrderData.quantity", buyBook[0].quantity == sellLimitOrderData.quantity)
                if (buyBook[0].quantity > sellLimitOrderData.quantity) {
                    console.log("INSIDE FIRST IF")
                    var selfRemainningQuantity = parseFloat(buyBook[0].quantity) - parseFloat(sellLimitOrderData.quantity);
                    console.log("selfRemainningQuantity", selfRemainningQuantity)
                    var orderData = {
                        quantity: selfRemainningQuantity
                    }
                    console.log("orderData", orderData)
                    console.log("sellBook[0].activity_id", buyBook[0].activity_id)
                    let updatedActivity = await ActivityUpdateHelper.updateActivityData(buyBook[0].activity_id, orderData);
                    console.log("currency_coin_id", currency_coin_id)
                    var orderValue = {
                        ...sellLimitOrderData
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
                        .andWhere("user_id", buyBook[0].user_id)
                        .andWhere("coin_id", currency_coin_id)
                        .orderBy("id", "DESC");

                    console.log("updateUserBalance", updateUserBalance)

                    if (updateUserBalance != undefined) {
                        var updateBalance = await WalletModel
                            .query()
                            .where("deleted_at", null)
                            .andWhere("user_id", sellLimitOrderData.user_id)
                            .andWhere("coin_id", currency_coin_id)
                            .patch({
                                'placed_balance': parseFloat(updateUserBalance.placed_balance) + (parseFloat(sellLimitOrderData.quantity) * parseFloat(buyBook[0].limit_price))
                            })
                    }

                    let updateBuyBook = await buyUpdate.updateBuyBook(buyBook[0].id, {
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

                    console.log("buyLimitOrderData.user_id", sellLimitOrderData.user_id)

                    var userNotification = await UserNotifications.getSingleData({
                        user_id: sellLimitOrderData.user_id,
                        deleted_at: null,
                        slug: 'trade_execute'
                    })
                    var user_data = await Users.getSingleData({
                        deleted_at: null,
                        id: sellLimitOrderData.user_id,
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

                } else if (buyBook[0].quantity == sellLimitOrderData.quantity) {
                    console.log("INSIDE SECOND IF")
                    var selfRemainningQuantity = parseFloat(buyBook[0].quantity) - parseFloat(sellLimitOrderData.quantity);
                    console.log("selfRemainningQuantity", selfRemainningQuantity)
                    if (selfRemainningQuantity == 0) {
                        var orderData = {
                            quantity: selfRemainningQuantity
                        }
                        console.log("orderData", orderData)
                        let updatedActivity = await ActivityUpdateHelper.updateActivityData(buyBook[0].activity_id, orderData);
                        var cancelPendingOrder = await cancelPendinOrder.cancelPendingOrder("Buy", "Limit", buyBook[0].id, true);

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
                        var userNotification = await UserNotifications.getSingleData({
                            user_id: sellLimitOrderData.user_id,
                            deleted_at: null,
                            slug: 'trade_execute'
                        })
                        var user_data = await Users.getSingleData({
                            deleted_at: null,
                            id: sellLimitOrderData.user_id,
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

                } else if (buyBook[0].quantity < sellLimitOrderData.quantity) {
                    console.log("buyLimitOrderData.quantity", sellLimitOrderData.quantity);
                    console.log("sellBook[0].quantity", buyBook[0].quantity)
                    var selfRemainningQuantity = parseFloat(sellLimitOrderData.quantity) - parseFloat(buyBook[0].quantity);
                    var orderData = {
                        quantity: buyBook[0].quantity
                    }

                    console.log("orderData", orderData)
                    var activityResult = await ActivityUpdateHelper.updateActiv
                    ityData(buyBook[0].activity_id, orderData);

                    var buyRecurseData = {
                        ...sellLimitOrderData
                    }
                    delete sellLimitOrderData.quantity;
                    buyRecurseData.quantity = selfRemainningQuantity;
                    console.log("buyRecurseData", buyRecurseData)
                    var cancelPendingOrder = await cancelPendinOrder.cancelPendingOrder("Buy", "Limit", buyBook[0].id, true);
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
                                    reason: "Self Order Execution"
                                })
                        }
                    }

                    console.log("selfRemainningQuantity", selfRemainningQuantity)

                    var userNotification = await UserNotifications.getSingleData({
                        user_id: sellLimitOrderData.user_id,
                        deleted_at: null,
                        slug: 'trade_execute'
                    })
                    var user_data = await Users.getSingleData({
                        deleted_at: null,
                        id: sellLimitOrderData.user_id,
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
                        var responseData = await module.exports.limitSellData(buyRecurseData, buyRecurseData.settle_currency, buyRecurseData.currency, activityResult, res, crypto_coin_id, currency_coin_id, allOrderData, originalQuantityValue, pending_order_id, is_checkbox_enabled);
                        return responseData;
                    }

                }
            }
        }

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
                    var availableQuantity = parseFloat(buyBook[0].quantity).toFixed(pairDetails.quantity_precision);
                    sellLimitOrderData.fill_price = parseFloat(buyBook[0].price).toFixed(pairDetails.price_precision);
                    delete sellLimitOrderData.id;
                    var sellAddedData = {
                        ...sellLimitOrderData
                    }
                    sellAddedData.is_partially_fulfilled = true;
                    var trade_history_data = {
                        ...sellLimitOrderData
                    }
                    trade_history_data.fix_quantity = quantityValue;
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

                    if (sellLimitOrderData.user_id == buyBook[0].user_id && sellLimitOrderData.user_id == process.env.TRADEDESK_USER_ID) {
                        var tradingFees = {
                            userFee: 0.0,
                            requestedFee: 0.0,
                            maker_fee: 0.0,
                            taker_fee: 0.0
                        }
                    } else {
                        var tradingFees = await TradingFees.getTraddingFees(request);
                    }

                    // console.log("tradingFees", tradingFees)

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
                    var remainningQuantity = availableQuantity - quantityValue;
                    console.log("remainningQuantity", remainningQuantity)
                    if (remainningQuantity > 0) {
                        let updateBuyBook = await buyUpdate.updateBuyBook(buyBook[0].id, {
                            quantity: parseFloat(remainningQuantity).toFixed(pairDetails.quantity_precision)
                        });
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

                        //Emit data in rooms
                        let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                        let referredData = await RefferalHelper.getAmount(tradeOrder, tradeOrder.user_id, tradeOrder.id);
                        return {
                            status: 1,
                            message: 'Order Success'
                        }
                    } else {
                        await buyDelete.deleteOrder(buyBook[0].id);
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

                        //Emit data in rooms
                        let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                        let referredData = await RefferalHelper.getAmount(tradeOrder, tradeOrder.user_id, tradeOrder.id);
                        return {
                            status: 1,
                            message: 'Order Success'
                        }
                    }
                } else {
                    // console.log("ELSE", remainningQuantity)
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
                    sellLimitOrderData.fill_price = parseFloat(buyBook[0].price).toFixed(pairDetails.price_precision);

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
                    trade_history_data.is_stop_limit = flag;
                    var activityResult = await ActivityUpdateHelper.updateActivityData(buyBook[0].activity_id, trade_history_data);
                    // console.log("activityResult", JSON.stringify(activityResult))

                    var request = {
                        requested_user_id: trade_history_data.requested_user_id,
                        user_id: trade_history_data.user_id,
                        currency: sellLimitOrderData.currency,
                        side: sellLimitOrderData.side,
                        settle_currency: sellLimitOrderData.settle_currency,
                        quantity: parseFloat(buyBook[0].quantity).toFixed(pairDetails.quantity_precision),
                        fill_price: parseFloat(sellLimitOrderData.fill_price).toFixed(pairDetails.price_precision),
                        crypto_coin_id,
                        currency_coin_id
                    }

                    if (sellLimitOrderData.user_id == buyBook[0].user_id && sellLimitOrderData.user_id == process.env.TRADEDESK_USER_ID) {
                        var tradingFees = {
                            userFee: 0.0,
                            requestedFee: 0.0,
                            maker_fee: 0.0,
                            taker_fee: 0.0
                        }
                    } else {
                        var tradingFees = await TradingFees.getTraddingFees(request);
                    }

                    // console.log("tradingFees", tradingFees)

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
                    // console.log(JSON.stringify(trade_history_data))

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

                    allOrderData.push(tradeHistory)
                    tradeOrder = tradeHistory;

                    await buyDelete.deleteOrder(buyBook[0].id);

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

                    //Emit data in rooms
                    let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)

                    var resendDataLimit = {
                        ...sellLimitOrderData
                    }

                    resendDataLimit.quantity = remainningQuantity;
                    resendDataLimit.activity_id = activityResult.id;

                    if (remainningQuantity > 0) {
                        var responseData = await module.exports.limitSellData(resendDataLimit, resendDataLimit.settle_currency, resendDataLimit.currency, activityResult, res, crypto_coin_id, currency_coin_id, allOrderData, originalQuantityValue, pending_order_id, is_checkbox_enabled);
                        return responseData
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
                if (sellLimitOrderData.user_id != process.env.TRADEDESK_USER_ID) {
                    if (walletData.placed_balance < sellLimitOrderData.quantity) {
                        var userNotification = await UserNotifications.getSingleData({
                            user_id: sellLimitOrderData.user_id,
                            deleted_at: null,
                            slug: 'trade_execute'
                        })
                        var user_data = await Users.getSingleData({
                            deleted_at: null,
                            id: sellLimitOrderData.user_id,
                            is_active: true
                        });

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
                // console.log("sellLimitOrderData.quantity", sellLimitOrderData.quantity)
                var sellAddedData = {
                    ...sellLimitOrderData
                }
                sellAddedData.fix_quantity = sellAddedData.quantity;
                sellAddedData.maker_fee = 0.0;
                sellAddedData.taker_fee = 0.0;
                delete sellAddedData.id;
                delete sellAddedData.side;
                delete sellAddedData.activity_id;
                sellAddedData.side = "Sell"
                if (sellAddedData.order_type == "StopLimit") {
                    sellAddedData.order_type = "Limit";
                    sellAddedData.price = sellLimitOrderData.limit_price;
                    sellAddedData.is_stop_limit = true;
                }
                var activity = await ActivityHelper.addActivityData(sellAddedData);
                sellAddedData.is_partially_fulfilled = true;
                sellLimitOrderData.is_filled = false;
                sellAddedData.activity_id = activity.id;
                sellLimitOrderData.added = true;
                var addSellBook = await SellAdd.SellOrderAdd(sellAddedData, crypto_coin_id);

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
                                    side: sellLimitOrderData.side,
                                    pair: sellLimitOrderData.symbol,
                                    order_type: sellLimitOrderData.order_type,
                                    quantity: sellLimitOrderData.quantity,
                                    price: sellLimitOrderData.limit_price,
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
                    status: 2,
                    message: 'Order Partially Fulfilled and Added to Sell Book'
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
            if (sellLimitOrderData.user_id != process.env.TRADEDESK_USER_ID) {

                if (walletData.placed_balance < sellLimitOrderData.quantity) {
                    var userNotification = await UserNotifications.getSingleData({
                        user_id: sellLimitOrderData.user_id,
                        deleted_at: null,
                        slug: 'trade_execute'
                    })
                    var user_data = await Users.getSingleData({
                        deleted_at: null,
                        id: sellLimitOrderData.user_id,
                        is_active: true
                    });

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
            // console.log("sellLimitOrderData.quantity", sellLimitOrderData)
            var sellAddedData = {
                ...sellLimitOrderData
            }
            sellAddedData.fix_quantity = sellAddedData.quantity;
            sellAddedData.maker_fee = 0.0;
            sellAddedData.taker_fee = 0.0;
            delete sellAddedData.id;
            delete sellAddedData.side;
            delete sellAddedData.activity_id;
            sellAddedData.side = "Sell"
            if (sellAddedData.order_type == "StopLimit") {
                sellAddedData.order_type = "Limit";
                sellAddedData.price = sellLimitOrderData.limit_price;
                sellAddedData.is_stop_limit = true;
            }
            var activity = await ActivityHelper.addActivityData(sellAddedData);
            // console.log("activity", activity)
            sellAddedData.is_partially_fulfilled = true;
            sellAddedData.is_filled = false;
            sellAddedData.activity_id = activity.id;
            sellAddedData.added = true;
            // console.log("sellAddedData", sellAddedData)
            var addSellBook = await SellAdd.SellOrderAdd(sellAddedData, crypto_coin_id);

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
                                side: sellLimitOrderData.side,
                                pair: sellLimitOrderData.symbol,
                                order_type: sellLimitOrderData.order_type,
                                quantity: sellLimitOrderData.quantity,
                                price: sellLimitOrderData.limit_price,
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
                status: 2,
                message: 'Order Partially Fulfilled and Added to Sell Book'
            }
        }
    } catch (error) {
        console.log(error)
        // console.log(JSON.stringify(error));
    }
}

module.exports = {
    limitSellData
}