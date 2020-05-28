var BuyBookModel = require("../../models/BuyBook");
var walletBalanceValue = require("../wallet/get-wallet-balance")
var WalletModel = require("../../models/Wallet")

var addBuyBookData = async (buyLimitOrderData) => {
    try {
        console.log("buyLimitOrderData", JSON.stringify(buyLimitOrderData))
        var currency = buyLimitOrderData.currency;
        var crypto = buyLimitOrderData.settle_currency;
        var total_price = buyLimitOrderData.limit_price * buyLimitOrderData.quantity;
        delete buyLimitOrderData.added;
        delete buyLimitOrderData.is_filled;
        if (buyLimitOrderData.manual_flag != undefined)
            delete buyLimitOrderData.manual_flag;
        buyLimitOrderData.working_indicator = false;

        var buyAdd = await BuyBookModel
            .query()
            .insertAndFetch({
                ...buyLimitOrderData
            });

        console.log("buyAdd", JSON.stringify(buyAdd));

        if (buyLimitOrderData.user_id == process.env.TRADEDESK_USER_ID && buyLimitOrderData.is_checkbox_selected == false) {
            return (buyAdd)
        }
        var walletBalance = await walletBalanceValue.getWalletBalance(buyLimitOrderData.settle_currency, buyLimitOrderData.currency, buyLimitOrderData.user_id);
        console.log("walletBalance", JSON.stringify(walletBalance))
        if (walletBalance != 0) {
            var balance = walletBalance.placed_balance;
            var updatedBalance = balance - total_price;
            var updatedBalance = parseFloat((updatedBalance).toFixed(6));

            console.log("updatedBalance", updatedBalance)

            var walletUpdate = await WalletModel
                .query()
                .where('id', walletBalance.id)
                .patch({
                    placed_balance: updatedBalance
                });

            return (buyAdd)
        } else {
            return ("Coin Not Found")
        }
    } catch (error) {
        console.log(JSON.stringify(error))
    }
}

module.exports = {
    addBuyBookData
}