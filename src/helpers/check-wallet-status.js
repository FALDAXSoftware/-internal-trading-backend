/*
Used to get wallet details based on userid and asset
*/
var CoinsModel = require("../models/Coins");
var WalletModel = require("../models/Wallet");

var checkWalletStatus = async (crypto, currency, user_id) => {
    var coinSql = `SELECT wallets.*, coins.coin
                    FROM wallets
                    LEFT JOIN coins
                    ON wallets.coin_id = coins.id
                    WHERE coins.is_active = 'true' AND coins.deleted_at IS NULL AND wallets.deleted_at is NULL AND wallets.receive_address is NOT NULL
                    AND wallets.user_id = ${user_id} AND (coins.coin = '${currency}' OR coins.coin = '${crypto}')`

    var walletBalance = await WalletModel.knex().raw(coinSql)
    // console.log("walletBalance", walletBalance)
    let res = {
        crypto: null,
        currency: null
    }
    for (let index = 0; index < walletBalance.rows.length; index++) {
        const element = walletBalance.rows[index];
        if (crypto == element.coin) {
            res.crypto = element
        } else if (currency == element.coin) {
            res.currency = element
        }

    }
    return res
}
// SELECT 
module.exports = {
    checkWalletStatus
}