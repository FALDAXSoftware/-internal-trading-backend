var SellBookModel = require("../../models/SellBook");
var WalletModel = require("../../models/Wallet");
var balanceValue = require("../wallet/get-sell-wallet-balance");

var SellOrderAdd = async (sellLimitOrderData) => {
    var currency = sellLimitOrderData.currency;
    var crypto = sellLimitOrderData.settle_currency;
    var total_price = sellLimitOrderData.quantity;

    var sellAdd = await SellBookModel
        .query()
        .insertAndFetch(sellLimitOrderData);

    var walletBalance = await balanceValue.getSellWalletBalance();

    var balance = walletBalance.placed_balance;
    var updatedBalance = balance - total_price;
    var updatedBalance = parseFloat((updatedBalance).toFixed(6));

    var walletUpdate = await WalletModel
        .query()
        .where('deleted_at', null)
        .andWhere('id', walletBalance.id)
        .patch({
            placed_balance: updatedBalance
        });

    return (sellAdd);
}

module.exports = {
    SellOrderAdd
}