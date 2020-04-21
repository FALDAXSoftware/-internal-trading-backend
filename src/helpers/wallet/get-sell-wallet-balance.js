var CoinsModel = require("../../models/Coins");
var WalletModel = require("../../models/Wallet");

var getSellWalletBalance = async (crypto, currency, user_id) => {
    var walletBalance;
    var coin = await CoinsModel
        .query()
        .first()
        .select()
        .where('is_active', true)
        .andWhere('deleted_at', null)
        .andWhere('coin', crypto)
        .orderBy('id', 'DESC');

    if (coin != undefined) {
        walletBalance = await WalletModel
            .query()
            .select()
            .first()
            .where('is_active', true)
            .andWhere('deleted_at', null)
            .andWhere('coin_id', coin.id)
            .andWhere('user_id', user_id)
            .orderBy('id', 'DESC')
        if (walletBalance != undefined && (walletBalance.receive_address != "" || walletBalance.receive_address != null)) {
            return (walletBalance)
        } else {
            // Wallet Not created
            return (1);
        }
    } else {
        // For Coin Not Found
        return (0)
    }
}

module.exports = {
    getSellWalletBalance
}