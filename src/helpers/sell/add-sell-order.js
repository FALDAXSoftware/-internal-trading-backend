var SellBookModel = require("../../models/SellBook");
var WalletModel = require("../../models/Wallet");
var balanceValue = require("../wallet/get-sell-wallet-balance");

var SellOrderAdd = async (sellLimitOrderData) => {
    var currency = sellLimitOrderData.currency;
    var crypto = sellLimitOrderData.settle_currency;
    var total_price = sellLimitOrderData.quantity;
    delete sellLimitOrderData.added;
    delete sellLimitOrderData.is_filled;
    sellLimitOrderData.working_indicator = false;

    var sellAdd = await SellBookModel
        .query()
        .insertAndFetch({ ...sellLimitOrderData });

    console.log("buyAdd", sellAdd);

    var walletBalance = await balanceValue.getSellWalletBalance(sellLimitOrderData.settle_currency, sellLimitOrderData.currency, sellLimitOrderData.user_id);
    console.log("walletBalance", walletBalance)
    if (walletBalance != 0) {
        var balance = walletBalance.placed_balance;
        var updatedBalance = balance - total_price;
        console.log(updatedBalance)
        var updatedBalance = parseFloat((updatedBalance).toFixed(6));

        var walletUpdate = await WalletModel
            .query()
            .where('deleted_at', null)
            .andWhere('id', walletBalance.id)
            .patch({
                placed_balance: updatedBalance
            });

        return (sellAdd);
    } else {
        return ("Coin Not Found")
    }
}

module.exports = {
    SellOrderAdd
}