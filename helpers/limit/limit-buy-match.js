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

var limitData = async (buyLimitOrderData, crypto, currency, activity) => {
    try {
        var userIds = [];
        userIds.push(buyLimitOrderData.user_id);
        if (buyLimitOrderData.orderQuantity <= 0) {
            // Invalid Quantity
            return (1);
        }
        let wallet = await WalletBalanceHelper.getWalletBalance(buyLimitOrderData.settle_currency, buyLimitOrderData.currency, buyLimitOrderData.user_id);
        let sellBook = await SellBookHelper.sellOrderBook(crypto, currency);
        let fees = await MakerTakerFees.getFeesValue(crypto, currency);

        if (sellBook && sellBook.length > 0) {
            if ((sellBook[0].price <= buyLimitOrderData.limit_price) || (sellBook[0].price <= buyLimitOrderData.stop_price)) {
                if (sellBook[0].quantity >= buyLimitOrderData.quantity) {
                    buyLimitOrderData.fill_price = sellBook[0].price;
                    delete buyLimitOrderData.id;
                    if ((buyLimitOrderData.fill_price * buyLimitOrderData.quantity).toFixed(8) <= (wallet.placed_balance).toFixed(8)) {
                        var buyAddedData = {
                            ...buyLimitOrderData
                        }
                        buyAddedData.is_partially_fulfilled = true;
                        var trade_history_data = {
                            ...buyLimitOrderData
                        }
                        if (buyLimitOrderData.quantity >= sellBook[0].quantity) {
                            trade_history_data.fix_quantity = sellBook[0].quantity
                        } else {
                            trade_history_data.fix_quantity = buyLimitOrderData.quantity
                        }
                        trade_history_data.maker_fee = fees.makerFee;
                        trade_history_data.taker_fee = fees.takerFee;
                        trade_history_data.requested_user_id = sellBook[0].user_id;
                        trade_history_data.created = moment().utc();
                        let updatedActivity = await ActivityUpdateHelper.updateActivityData(sellBook[0].activity_id, trade_history_data);

                        userIds.push(parseInt(trade_history_data.requested_user_id));
                        var request = {
                            requested_user_id: trade_history_data.requested_user_id,
                            user_id: trade_history_data.user_id,
                            currency: buyLimitOrderData.currency,
                            side: buyLimitOrderData.side,
                            settle_currency: buyLimitOrderData.settle_currency,
                            quantity: buyLimitOrderData.quantity,
                            fill_price: buyLimitOrderData.fill_price
                        }

                        var tradingFees = await TradingFees.getTraddingFees(request, fees.makerFee, fees.takerFee);

                        trade_history_data.user_fee = tradingFees.userFee;
                        trade_history_data.requested_fee = tradingFees.requestedFee;
                        trade_history_data.user_coin = buyLimitOrderData.settle_currency;
                        trade_history_data.requested_coin = buyLimitOrderData.currency;

                        var tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                        var remainigQuantity = availableQuantity - quantityValue;
                        console.log("remainigQuantity", remainigQuantity)
                        if (remainigQuantity > 0) {
                            let updatedSellBook = await sellUpdate.updateSellBook(currentSellBookDetails.id, {
                                quantity: remainigQuantity
                            });
                            // Pass notification
                            // Emit Event
                        } else {
                            await sellDelete.deleteSellOrder(currentSellBookDetails.id);
                            // Pass notification
                            // Emit Event
                        }
                    } else {
                        // Insufficent Funds Error
                        return (2)
                    }
                } else {
                    var remainigQuantity = buyLimitOrderData.quantity - sellBook[0].quantity;
                    remainigQuantity = parseFloat(remainigQuantity).toFixed(8)
                    var feeResult = await MakerTakerFees.getFeesValue(buyLimitOrderData.settle_currency, buyLimitOrderData.currency);
                    if ((buyLimitOrderData.fill_price * buyLimitOrderData.quantity) <= wallet.placed_balance) {
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

                        trade_history_data.maker_fee = feeResult.makerFee;
                        trade_history_data.taker_fee = feeResult.takerFee;
                        trade_history_data.quantity = sellBook[0].quantity;
                        trade_history_data.requested_user_id = sellBook[0].user_id;
                        trade_history_data.created = moment().utc();

                        var activityResult = await ActivityUpdateHelper.updateActivityData(sellBook[0].activity_id, trade_history_data);

                        var request = {
                            requested_user_id: trade_history_data.requested_user_id,
                            user_id: trade_history_data.user_id,
                            currency: buyLimitOrderData.currency,
                            side: buyLimitOrderData.side,
                            settle_currency: buyLimitOrderData.settle_currency,
                            quantity: sellBook[0].quantity,
                            fill_price: buyLimitOrderData.fill_price
                        }

                        var tradingFees = await TradingFees.getTraddingFees(request, fees.makerFee, fees.takerFee);
                        trade_history_data.user_fee = (tradingFees.userFee);
                        trade_history_data.requested_fee = (tradingFees.requestedFee);
                        trade_history_data.user_coin = crypto;
                        trade_history_data.requested_coin = currency;

                        let TradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
                        await sellDelete.deleteSellOrder(currentSellBookDetails.id);
                        // Send Notification To user
                        //  Emit event here
                        var resendDataLimit = {
                            ...buyLimitOrderData
                        }

                        resendDataLimit.quantity = remainingQty;
                        resendDataLimit.activity_id = activityResult.id;

                        if (remainigQuantity > 0) {
                            var responseData = await module.exports.limitData(resendDataLimit, resendData.settle_currency, resendData.currency, activityResult);
                            return responseData;
                        }
                    } else {
                        return (2);
                    }
                }
            } else {
                if ((buyLimitOrderData.quantity * buyLimitOrderData.limit_price).toFixed(8) <= (wallet.placed_balance).toFixed(8)) {
                    var buyAddedData = {
                        ...buyLimitOrderData
                    };
                    buyAddedData.fix_quantity = buyAddedData.quantity;
                    buyAddedData.maker_fee = fees.makerFee;
                    buyAddedData.taker_fee = fees.takerFee;
                    delete buyAddedData.id;
                    delete buyAddedData.side;
                    buyAddedData.side = "Buy";
                    var activity = await ActivityHelper.addActivityData(buyAddedData);
                    buyAddedData.is_partially_fulfilled = true;
                    buyAddedData.activity_id = addData.id;
                    var addBuyBook = await BuyAdd.addBuyBookData(buyAddedData);

                    // Send Notification to users
                    // Emit Socket Event
                } else {
                    // Insufficent Funds Error
                    return (2)
                }
            }
        } else {
            if ((buyLimitOrderData.quantity * buyLimitOrderData.limit_price).toFixed(8) <= (wallet.placed_balance).toFixed(8)) {
                var buyAddedData = {
                    ...buyLimitOrderData
                };
                buyAddedData.fix_quantity = buyAddedData.quantity;
                buyAddedData.maker_fee = fees.makerFee;
                buyAddedData.taker_fee = fees.takerFee;
                delete buyAddedData.id;
                delete buyAddedData.side;
                buyAddedData.side = "Buy";
                var activity = await ActivityHelper.addActivityData(buyAddedData);
                buyAddedData.is_partially_fulfilled = true;
                buyAddedData.activity_id = addData.id;
                var addBuyBook = await BuyAdd.addBuyBookData(buyAddedData);

                // Send Notification to users
                // Emit Socket Event
            } else {
                // Insufficent Funds Error
                return (2)
            }
        }
    } catch (error) {

    }
}

module.exports = {
    limitData
}