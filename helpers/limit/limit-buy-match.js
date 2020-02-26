var WalletBalanceHelper = require("../../helpers/wallet/get-wallet-balance");
var SellBookHelper = require("../../helpers/sell/get-sell-book-order");
var MakerTakerFees = require("../../helpers/wallet/get-maker-taker-fees");
var BuyAdd = require("../../helpers/buy/add-buy-order");
var ActivityHelper = require("../../helpers/activity/add");

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