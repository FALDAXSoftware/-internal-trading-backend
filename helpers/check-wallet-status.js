/*
Used to get wallet details based on userid and asset
*/
var CoinsModel = require("../models/Coins");
var WalletModel = require("../models/Wallet");

var checkWalletStatus = async (asset, user_id) => {
    var wallet_data;
    var coin = await CoinsModel
        .query()
        .first()
        .select()
        .where('is_active', true)
        .andWhere('deleted_at', null)
        .andWhere('coin', asset)
        .orderBy('id', 'DESC');

    if (coin != undefined) {
        wallet_data = await WalletModel
            .query()
            .select()
            .first()
            .where('is_active', true)
            .andWhere('deleted_at', null)
            .andWhere('coin_id', coin.id)
            .andWhere('user_id', user_id)
            .orderBy('id', 'DESC')
        if (wallet_data != undefined && (wallet_data.receive_address != "" || wallet_data.receive_address != null)) {
            return (wallet_data)
        } else {
            return (0);
        }
    } else {
        return (2);
    }
}

module.exports = {
    checkWalletStatus
}