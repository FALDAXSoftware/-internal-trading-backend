var BuyBookModel = require("../../models/BuyBook");
var walletBalanceValue = require("../wallet/get-wallet-balance")
var WalletModel = require("../../models/Wallet")

var addBuyBookData = async (buyLimitOrderData) => {
    var currency = buyLimitOrderData.currency;
    var crypto = buyLimitOrderData.settle_currency;
    var total_price = orderData.limit_price * orderData.quantity;

    var buyAdd = await BuyBookModel
        .query()
        .insertAndFetch({
            buyLimitOrderData
        });

    var walletBalance = await walletBalanceValue.getWalletBalance();

    if (walletBalance != 0) {
        var balance = walletBalance.placed_balance;
        var updatedBalance = balance - total_price;
        var updatedBalance = parseFloat((updatedBalance).toFixed(6));

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
}

module.exports = {
    addBuyBookData
}