var SellBookModel = require("../../models/SellBook");
var WalletModel = require("../../models/Wallet");
var balanceValue = require("../wallet/get-sell-wallet-balance");

var SellOrderAdd = async (sellLimitOrderData, crypto_coin_id) => {
    var total_price = sellLimitOrderData.quantity;
    delete sellLimitOrderData.added;
    delete sellLimitOrderData.is_filled;
    sellLimitOrderData.working_indicator = false;

    var sellAdd = await SellBookModel
        .query()
        .insertAndFetch({ ...sellLimitOrderData });

    console.log("buyAdd", JSON.stringify(sellAdd));

    if (sellLimitOrderData.user_id == process.env.TRADEDESK_USER_ID) {
        return (sellAdd);
    }

    var walletBalance = await WalletModel
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('coin_id', crypto_coin_id)
        .andWhere("user_id", sellLimitOrderData.user_id)
        .orderBy("id", "DESC")

    var balance = walletBalance.placed_balance;
    var updatedBalance = balance - total_price;
    console.log(updatedBalance)
    var updatedBalance = parseFloat((updatedBalance).toFixed(6));

    var walletUpdate = await WalletModel
        .query()
        .where('deleted_at', null)
        .andWhere('coin_id', crypto_coin_id)
        .andWhere("user_id", sellLimitOrderData.user_id)
        .patch({
            placed_balance: updatedBalance
        });

    return (sellAdd);
}

module.exports = {
    SellOrderAdd
}