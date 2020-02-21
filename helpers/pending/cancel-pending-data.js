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
    var now = moment().now();
    var crypto;
    var currency;
    var userIds = [];

    if (type == "Limit" && side == "Buy") {
        var pendingBookDetailsBuy = await BuyBookModel
            .query()
            .select()
            .first()
            .where('deleted_at', null)
            .andWhere('id', id)

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

        var activityCancel = await ActivityTableModel
            .query()
            .where('deleted_at', null)
            .andWhere('id', pendingBookDetailsBuy.activity_id)
            .patch({
                is_cancel: true
            })

        deletePending = await BuyBookModel
            .query()
            .where('id', id)
            .andWhere('deleted_at', null)
            .updateAndFetch({
                deleted_at: now
            });
    } else if (type == "Limit" && side == "Sell") {
        var pendingBookDetailsSell = await SellBookModel
            .query()
            .select()
            .first()
            .where('deleted_at', null)
            .andWhere('id', id)
            .orderBy('id', 'DESC')

        crypto = pendingBookDetailsSell.settle_currency;
        currency = pendingBookDetailsSell.currency;
        userIds.push(pendingBookDetailsSell.user_id);

        var fees = await feesValue.getFeesValue(pendingBookDetailsSell.settle_currency, pendingBookDetailsSell.currency);

        var coinId = await Coins
            .query()
            .findOne({
                where: {
                    coin: pendingBookDetailsSell.settle_currency,
                    deleted_at: null
                }
            });

        var walletDetails = await Wallet.findOne({
            where: {
                user_id: pendingBookDetailsSell.user_id,
                coin_id: coinId.id,
                deleted_at: null
            }
        });

        var userPlacedBalance = walletDetails.placed_balance + (pendingBookDetailsSell.quantity);

        var updateWalletDetails = await Wallet
            .update({
                user_id: pendingBookDetailsSell.user_id,
                coin_id: coinId.id
            })
            .set({
                placed_balance: userPlacedBalance
            });

        if (pendingBookDetailsSell.length === 0) {
            // throw("No buy limit order found.")
            return exits.noBuyLimitOrder();

        }

        var activityCancel = await ActivityTable
            .update({
                id: pendingBookDetailsSell.activity_id
            })
            .set({
                is_cancel: true
            });

        deletePending = await SellBook
            .update({
                id: inputs.id
            })
            .set({
                deleted_at: now
            })
            .fetch();
    }
}

module.exports = {
    cancelPendingOrder
}