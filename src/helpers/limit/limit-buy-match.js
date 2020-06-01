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
var Helper = require("../../helpers/helpers");
var Users = require("../../models/UsersModel");
var socketHelper = require("../../helpers/sockets/emit-trades");
var RefferalHelper = require("../get-refffered-amount");
var fiatValueHelper = require("../get-fiat-value");

var limitData = async (buyLimitOrderData, crypto, currency, activity, res = null, crypto_coin_id = null, currency_coin_id = null, allOrderData = []) => {
    try {
        var pairDetails = await PairsModel
            .query()
            .first()
            .select("name", "quantity_precision", "price_precision")
            .where("deleted_at", null)
            .andWhere("name", buyLimitOrderData.symbol)
            .orderBy("id", "DESC")

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
            if ((buyLimitOrderData.order_type == "Limit") ? (sellBook[0].price <= buyLimitOrderData.limit_price) : (sellBook[0].price <= buyLimitOrderData.stop_price && sellBook[0].price <= buyLimitOrderData.limit_price)) {
                console.log("INSIDE IF")
                if (sellBook[0].quantity >= buyLimitOrderData.quantity) {
                    console.log("INSIDE SECOND IF")
                    var availableQuantity = sellBook[0].quantity;
                    buyLimitOrderData.fill_price = sellBook[0].price;
                    delete buyLimitOrderData.id;
                    console.log((buyLimitOrderData.fill_price * buyLimitOrderData.quantity).toFixed(8) <= (wallet.placed_balance).toFixed(8))
                    if (((buyLimitOrderData.fill_price * buyLimitOrderData.quantity) <= (wallet.placed_balance)) || buyLimitOrderData.placed_by == process.env.TRADEDESK_BOT || buyLimitOrderData.placed_by == process.env.TRADEDESK_MANUAL) {
                        console.log("buyLimitOrderData", JSON.stringify(buyLimitOrderData))
                        var buyAddedData = {
                            ...buyLimitOrderData
                        }
                        buyAddedData.is_partially_fulfilled = true;
                        var trade_history_data = {
                            ...buyLimitOrderData
                        }
                        trade_history_data.fix_quantity = (quantityValue).toFixed(pairDetails.quantity_precision);
                        console.log(JSON.stringify(trade_history_data))
                        console.log("buyLimitOrderData.quantity >= sellBook[0].quantity", buyLimitOrderData.quantity >= sellBook[0].quantity)

                        console.log("trade_history_data", JSON.stringify(trade_history_data))
                        trade_history_data.maker_fee = 0.0;
                        trade_history_data.taker_fee = 0.0;
                        trade_history_data.requested_user_id = sellBook[0].user_id;
                        trade_history_data.created_at = new Date();
                        trade_history_data.quantity = (buyLimitOrderData.quantity).toFixed(pairDetails.quantity_precision);
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
                            quantity: (buyLimitOrderData.quantity).toFixed(pairDetails.quantity_precision),
                            fill_price: (buyLimitOrderData.fill_price).toFixed(pairDetails.price_precision),
                            crypto_coin_id,
                            currency_coin_id
                        }
                        var tradingFees = await TradingFees.getTraddingFees(request);

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
                        console.log("BELOW DELETED")
                        // tradeHistory.txn_group_id = txnGroupId;
                        var tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                        console.log("tradeHistory", tradeHistory)
                        tradeOrder = tradeHistory;
                        allOrderData.push(tradeHistory);
                        console.log("tradeOrder", tradeOrder)
                        var remainigQuantity = availableQuantity - quantityValue;
                        if (remainigQuantity > 0) {
                            let updatedSellBook = await sellUpdate.updateSellBook(sellBook[0].id, {
                                quantity: (remainigQuantity).toFixed(pairDetails.quantity_precision)
                            });
                            //Emit data in rooms
                            let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                            // Email Data
                            let emailData = {
                                userIds: userIds,
                                orderData: allOrderData
                            }
                            return {
                                status: 1,
                                message: 'Order Success',
                                tradeData: emailData
                            }
                        } else {
                            await sellDelete.deleteSellOrder(sellBook[0].id);

                            //Emit data in rooms
                            let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                            // Email Data
                            let emailData = {
                                userIds: userIds,
                                orderData: allOrderData
                            }
                            return {
                                status: 1,
                                message: 'Order Success',
                                tradeData: emailData
                            }
                        }
                    } else {
                        return {
                            status: 3,
                            message: 'Insufficient balance to place order'
                        }
                    }
                } else {
                    console.log("=>If Order can be filled from different book");
                    console.log("INSIDE ELSE")
                    var remainigQuantity = buyLimitOrderData.quantity - sellBook[0].quantity;
                    remainigQuantity = parseFloat(remainigQuantity).toFixed(pairDetails.toFixed(pairDetails.quantity_precision));
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
                        sellBook[0].quantity = (sellBook[0].quantity).toFixed(pairDetails.quantity_precision);
                        sellBook[0].price = (sellBook[0].price).toFixed(pairDetails.price_precision);

                        var flag = false;
                        if (sellBook[0].is_stop_limit == true) {
                            flag = true;
                        }

                        buyLimitOrderData.quantity = sellBook[0].quantity;
                        buyLimitOrderData.order_status = "partially_filled";
                        buyLimitOrderData.fill_price = sellBook[0].price;

                        var deleteResult = await sellDelete.deleteSellOrder(sellBook[0].id)
                        delete buyLimitOrderData.id;
                        var trade_history_data = {
                            ...buyLimitOrderData
                        };
                        trade_history_data.fix_quantity = quantityValue;

                        trade_history_data.maker_fee = 0.0;
                        trade_history_data.taker_fee = 0.0;
                        trade_history_data.quantity = sellBook[0].quantity;
                        trade_history_data.requested_user_id = sellBook[0].user_id;
                        trade_history_data.created_at = new Date();
                        trade_history_data.flag = true;

                        var activityResult = await ActivityUpdateHelper.updateActivityData(sellBook[0].activity_id, trade_history_data);
                        console.log("activityResult", JSON.stringify(activityResult))
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

                        console.log("trade_history_data", JSON.stringify(trade_history_data))
                        // tradeHistory.txn_group_id = txnGroupId;
                        let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                        tradeOrder = tradeHistory;
                        allOrderData.push(tradeHistory);
                        await sellDelete.deleteSellOrder(sellBook[0].id);
                        //Emit data in rooms
                        let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                        var resendDataLimit = {
                            ...buyLimitOrderData
                        }

                        resendDataLimit.quantity = remainigQuantity;
                        resendDataLimit.activity_id = activityResult.id;

                        console.log("resendDataLimit", JSON.stringify(resendDataLimit));
                        console.log("resendDataLimit, resendData.settle_currency, resendData.currency, activityResult", resendDataLimit, resendData.settle_currency, resendData.currency, activityResult)

                        if (remainigQuantity > 0) {
                            console.log("++++Order executing with more books");
                            var responseData = await module.exports.limitData(resendDataLimit, resendData.settle_currency, resendData.currency, activityResult, res, crypto_coin_id, currency_coin_id, allOrderData);
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
                console.log("INSIDE ELSE", JSON.stringify(buyLimitOrderData))
                if ((buyLimitOrderData.quantity * buyLimitOrderData.limit_price).toFixed(8) <= (wallet.placed_balance).toFixed(8) || buyLimitOrderData.placed_by == process.env.TRADEDESK_BOT || buyLimitOrderData.placed_by == process.env.TRADEDESK_MANUAL) {
                    var buyAddedData = {
                        ...buyLimitOrderData
                    };
                    buyAddedData.fix_quantity = (buyAddedData.quantity).toFixed(pairDetails.quantity_precision);
                    buyAddedData.maker_fee = 0.0;
                    buyAddedData.taker_fee = 0.0;
                    if (buyAddedData.order_type == "StopLimit") {
                        buyAddedData.order_type = "Limit";
                        buyAddedData.price = (buyLimitOrderData.limit_price).toFixed(pairDetails.price_precision);
                        buyAddedData.is_stop_limit = true;
                    }
                    delete buyAddedData.id;
                    delete buyAddedData.side;
                    delete buyAddedData.activity_id;
                    buyAddedData.side = "Buy";
                    console.log("buyAddedData", JSON.stringify(buyAddedData))
                    var activity = await ActivityHelper.addActivityData(buyAddedData);
                    console.log("activity", JSON.stringify(activity))
                    buyAddedData.is_partially_fulfilled = true;
                    buyLimitOrderData.is_filled = false;
                    buyAddedData.activity_id = activity.id;
                    buyLimitOrderData.added = true;
                    var addBuyBook = await BuyAdd.addBuyBookData(buyAddedData);
                    console.log(JSON.stringify(addBuyBook))
                    // Emit Socket Event
                    let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
                    // Email Data
                    let emailData = {
                        userIds: userIds,
                        orderData: allOrderData
                    }
                    return {
                        status: 2,
                        message: 'Order Partially Fulfilled and Added to Buy Book',
                        tradeData: emailData
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
                buyAddedData.fix_quantity = (buyAddedData.quantity).toFixed(pairDetails.quantity_precision);
                buyAddedData.maker_fee = 0.0;
                buyAddedData.taker_fee = 0.0;
                delete buyAddedData.id;
                delete buyAddedData.side;
                delete buyAddedData.activity_id;
                buyAddedData.side = "Buy";
                if (buyAddedData.order_type == "StopLimit") {
                    buyAddedData.order_type = "Limit";
                    buyAddedData.price = (buyLimitOrderData.limit_price).toFixed(pairDetails.price_precision);
                    buyAddedData.is_stop_limit = true;
                    // buyAddedData.side = "Buy";
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
                                    console.log("++++Order placed");
                                    var allData = {
                                        template: "emails/general_mail.ejs",
                                        templateSlug: "trade_place",
                                        email: user_data.email,
                                        user_detail: user_data,
                                        formatData: {
                                            recipientName: user_data.first_name,
                                            pair: buyLimitOrderData.symbol
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
        console.log(JSON.stringify(error));
    }
}

module.exports = {
    limitData
}