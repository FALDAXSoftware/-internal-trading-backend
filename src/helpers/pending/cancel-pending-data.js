var moment = require('moment')
var PendingBookModel = require("../../models/PendingBook");
var BuyBookModel = require("../../models/BuyBook");
var WalletModel = require("../../models/Wallet");
var CoinsModel = require("../../models/Coins");
var ActivityTableModel = require("../../models/Activity");
var SellBookModel = require("../../models/SellBook");
var socketHelper = require("../sockets/emit-trades");

var cancelPendingOrder = async (side, type, id) => {
    try {
        var deletePending;
        var now = moment().format();
        var crypto;
        var currency;
        var userIds = [];

        console.log(side, type, id)

        if (type == "Limit" && side == "Buy") {
            var pendingBookDetailsBuy = await BuyBookModel
                .query()
                .select()
                .first()
                .where('deleted_at', null)
                .andWhere('id', id)

            console.log(pendingBookDetailsBuy)
            crypto = pendingBookDetailsBuy.settle_currency;
            currency = pendingBookDetailsBuy.currency;
            userIds.push(pendingBookDetailsBuy.user_id);

            console.log("pendingBookDetailsBuy", pendingBookDetailsBuy)

            var sqlData = `SELECT wallets.balance, wallets.placed_balance, coins.id
                        FROM coins
                        LEFT JOIN wallets
                        ON coins.id = wallets.coin_id
                        WHERE coins.is_active = 'true' AND coins.deleted_at IS NULL
                        AND wallets.deleted_at IS NULL AND coins.coin = '${pendingBookDetailsBuy.currency}' 
                        AND wallets.user_id = ${pendingBookDetailsBuy.user_id}`

            var walletDetails = await CoinsModel.knex().raw(sqlData);
            walletDetails = walletDetails.rows;

            console.log("walletDetails", walletDetails)

            var userPlacedBalance = walletDetails[0].placed_balance + (pendingBookDetailsBuy.price * pendingBookDetailsBuy.quantity);

            var updateWalletDetails = await WalletModel
                .query()
                .where('user_id', pendingBookDetailsBuy.user_id)
                .andWhere('deleted_at', null)
                .andWhere('coin_id', walletDetails[0].id)
                .patch({
                    placed_balance: userPlacedBalance
                })

            if (pendingBookDetailsBuy.length === 0) {
                // throw("No buy limit order found.")
                return (0);
            }


            console.log("pendingBookDetailsBuy", pendingBookDetailsBuy)
            var activityCancel = await ActivityTableModel
                .query()
                .where('deleted_at', null)
                .andWhere('id', pendingBookDetailsBuy.activity_id)
                .patch({
                    is_cancel: true
                })

            var updateSql = `UPDATE buy_book 
                            SET deleted_at = '${now}' 
                            WHERE id = ${pendingBookDetailsBuy.id} AND deleted_at IS NULL
                            RETURNING *`

            var deletePending = await BuyBookModel.knex().raw(updateSql);
            deletePending = deletePending.rows;

            console.log("deletePending", deletePending)

        } else if (type == "Limit" && side == "Sell") {
            var pendingBookDetailsSell = await SellBookModel
                .query()
                .first()
                .select()
                .where('deleted_at', null)
                .andWhere('id', id)
                .orderBy('id', 'DESC')

            console.log(pendingBookDetailsSell)

            crypto = pendingBookDetailsSell.settle_currency;
            currency = pendingBookDetailsSell.currency;
            userIds.push(pendingBookDetailsSell.user_id);

            var sqlData = `SELECT wallets.balance, wallets.placed_balance, coins.id
                        FROM coins
                        LEFT JOIN wallets
                        ON coins.id = wallets.coin_id
                        WHERE coins.is_active = 'true' AND coins.deleted_at IS NULL
                        AND wallets.deleted_at IS NULL AND coins.coin = '${pendingBookDetailsSell.settle_currency}' 
                        AND wallets.user_id = ${pendingBookDetailsSell.user_id}`

            var walletDetails = await CoinsModel.knex().raw(sqlData);
            walletDetails = walletDetails.rows;

            console.log("walletDetails", walletDetails)

            var userPlacedBalance = parseFloat(walletDetails[0].placed_balance) + (pendingBookDetailsSell.quantity);
            console.log("userPlacedBalance", userPlacedBalance)

            var updateWalletDetails = await WalletModel
                .query()
                .where('user_id', pendingBookDetailsSell.user_id)
                .andWhere('coin_id', walletDetails[0].id)
                .andWhere('deleted_at', null)
                .patch({
                    placed_balance: userPlacedBalance
                })

            if (pendingBookDetailsSell.length === 0) {
                // throw("No sell limit order found.")
                return (1);
            }

            var activityCancel = await ActivityTableModel
                .query()
                .where('id', pendingBookDetailsSell.activity_id)
                .andWhere('deleted_at', null)
                .patch({
                    is_cancel: true
                })

            var updateSql = `UPDATE sell_book 
            SET deleted_at = '${now}' 
            WHERE id = ${pendingBookDetailsSell.id} AND deleted_at IS NULL
            RETURNING *`

            var deletePending = await SellBookModel.knex().raw(updateSql);
            deletePending = deletePending.rows;

            console.log("deletePending", deletePending)

        } else {
            var pendingDetails = await PendingBookModel
                .query()
                .select()
                .first()
                .where('id', id)
                .andWhere('deleted_at', null)
                .orderBy('id', 'DESC')

            console.log("pendingDetails", pendingDetails)

            crypto = pendingDetails.settle_currency;
            currency = pendingDetails.currency;
            userIds.push(pendingDetails.user_id);

            if (pendingDetails == undefined || pendingDetails.length == 0) {
                // throw("No pending order found.")
                return (3);

            }

            var activityCancel = await ActivityTableModel
                .query()
                .where('id', pendingDetails.activity_id)
                .andWhere('deleted_at', null)
                .patch({
                    is_cancel: true
                })

            var updateSql = `UPDATE pending_book 
            SET deleted_at = '${now}' 
            WHERE id = ${pendingDetails.id} AND deleted_at IS NULL
            RETURNING *`

            var deletePending = await PendingBookModel.knex().raw(updateSql);
            deletePending = deletePending.rows;

            console.log("userIds", userIds)
        }
        console.log(deletePending)
        if (deletePending) {
            //Emit data in rooms
            let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds);
            console.log("FINALLLY");
            // return {
            //     status: 1,
            //     message: ''
            // }
            return (4)
        } else {
            // throw "Server Error";
            return (5);
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    cancelPendingOrder
}
