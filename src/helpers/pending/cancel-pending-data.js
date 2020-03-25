var moment = require('moment')
var PendingBookModel = require("../../models/PendingBook");
var BuyBookModel = require("../../models/BuyBook");
var WalletModel = require("../../models/Wallet");
var CoinsModel = require("../../models/Coins");
var ActivityTableModel = require("../../models/Activity");
var SellBookModel = require("../../models/SellBook");
var feesValue = require("../wallet/get-maker-taker-fees")

var cancelPendingOrder = async (side, type, id) => {
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


        var fees = await feesValue.getFeesValue(pendingBookDetailsBuy.settle_currency, pendingBookDetailsBuy.currency);
        var coinId = await CoinsModel
            .query()
            .first()
            .select()
            .where('coin', pendingBookDetailsBuy.currency)
            .andWhere('deleted_at', null)
            .orderBy('id', 'DESC');

        var walletDetails = await WalletModel
            .query()
            .first()
            .select()
            .where('deleted_at', null)
            .andWhere('coin_id', coinId.id)
            .andWhere('user_id', pendingBookDetailsBuy.user_id)
            .orderBy('id', 'DESC');

        console.log(walletDetails)

        var userPlacedBalance = walletDetails.placed_balance + (pendingBookDetailsBuy.price * pendingBookDetailsBuy.quantity);

        var updateWalletDetails = await WalletModel
            .query()
            .where('user_id', pendingBookDetailsBuy.user_id)
            .andWhere('deleted_at', null)
            .andWhere('coin_id', coinId.id)
            .patch({
                placed_balance: userPlacedBalance
            })

        if (pendingBookDetailsBuy.length === 0) {
            // throw("No buy limit order found.")
            return (0);
        }


        console.log(pendingBookDetailsBuy)
        var activityCancel = await ActivityTableModel
            .query()
            .where('deleted_at', null)
            .andWhere('id', pendingBookDetailsBuy.activity_id)
            .patch({
                is_cancel: true
            })

        deletePendingFirst = await BuyBookModel
            .query()
            .where('id', id)
            .andWhere('deleted_at', null)
            .patch({
                deleted_at: now
            });

        var deletePending = await BuyBookModel
            .query()
            .select()
            .where('id', id)

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

        var fees = await feesValue.getFeesValue(pendingBookDetailsSell.settle_currency, pendingBookDetailsSell.currency);

        var coinId = await CoinsModel
            .query()
            .select()
            .first()
            .where('deleted_at', null)
            .andWhere('coin', pendingBookDetailsSell.settle_currency)
            .orderBy('id', 'DESC');

        var walletDetails = await WalletModel
            .query()
            .first()
            .select()
            .where('user_id', pendingBookDetailsSell.user_id)
            .andWhere('coin_id', coinId.id)
            .andWhere('deleted_at', null)
            .orderBy('id', 'DESC');

        console.log(walletDetails)


        var userPlacedBalance = walletDetails.placed_balance + (pendingBookDetailsSell.quantity);

        var updateWalletDetails = await WalletModel
            .query()
            .where('user_id', pendingBookDetailsSell.user_id)
            .andWhere('coin_id', coinId.id)
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

        deletePendingFirst = await SellBookModel
            .query()
            .where('id', id)
            .patch({
                deleted_at: now
            })

        deletePending = await SellBookModel
            .query()
            .select()
            .where('id', id)

        console.log(deletePending)

    } else {
        var pendingDetails = await PendingBookModel
            .query()
            .select()
            .first()
            .where('id', id)
            .andWhere('deleted_at', null)
            .orderBy('id', 'DESC')

        console.log(pendingDetails)

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

        deletePendingFirst = await PendingBookModel
            .query()
            .where('id', id)
            .patch({
                deleted_at: now
            });

        deletePending = await PendingBookModel
            .query()
            .select()
            .where('id', id)
    }
    console.log(deletePending)
    if (deletePending) {
        // Socket
        // await sails
        //     .helpers
        //     .sockets
        //     .tradeEmit(crypto, currency, userIds);
        return (4)
    } else {
        // throw "Server Error";
        return (5);
    }
}

module.exports = {
    cancelPendingOrder
}