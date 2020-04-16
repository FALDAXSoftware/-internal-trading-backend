var BuyBookModel = require("../../models/BuyBook");
var walletBalanceValue = require("../wallet/get-wallet-balance")
var WalletModel = require("../../models/Wallet")

var addBuyBookData = async (buyLimitOrderData) => {
    try {
        console.log("buyLimitOrderData", buyLimitOrderData)
        var currency = buyLimitOrderData.currency;
        var crypto = buyLimitOrderData.settle_currency;
        var total_price = buyLimitOrderData.limit_price * buyLimitOrderData.quantity;
        delete buyLimitOrderData.added;
        delete buyLimitOrderData.is_filled;
        buyLimitOrderData.working_indicator = false;

        var buyAdd = await BuyBookModel
            .query()
            .insertAndFetch({
                ...buyLimitOrderData
            });

        console.log("buyAdd", buyAdd);

        var walletBalance = await walletBalanceValue.getWalletBalance(buyLimitOrderData.settle_currency, buyLimitOrderData.currency, buyLimitOrderData.user_id);
        console.log("walletBalance", walletBalance)
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
        console.log(error)
    }
}

module.exports = {
    addBuyBookData
}