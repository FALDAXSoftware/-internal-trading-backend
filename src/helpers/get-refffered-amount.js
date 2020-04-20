var UserModel = require("../models/UsersModel");
var AdminSettingModel = require("../models/AdminSetting");
var coinsModel = require("../models/Coins");
var ReferralModel = require("../models/Referral");

var getAmount = async (trade_object, user_id, transaction_id) => {
    var referral_percentage = 0;
    var collectedAmount = 0;
    var collectCoin;
    var coinData;
    var referralData = await UserModel
        .query()
        .select()
        .first()
        .where('deleted_at', null)
        .andWhere("is_active", true)
        .andWhere("id", user_id)
        .orderBy("id", "DESC")

    var referredUserData = await UserModel
        .query()
        .select()
        .first()
        .where('deleted_at', null)
        .andWhere("is_active", true)
        .andWhere("id", referralData.referred_id)
        .orderBy("id", "DESC");

    var addRefferalAddData = {};

    if (referredUserData !== undefined && referredUserData.referal_percentage > 0) {
        referral_percentage = parseFloat(referredUserData.referal_percentage);
    } else {
        var referal_data = await AdminSettingModel
            .query()
            .select()
            .first()
            .where("deleted_at", null)
            .andWhere("slug", "default_referral_percentage")
            .orderBy("id", "DESC");
        referral_percentage = parseFloat(referal_data.value);
    }

    if (referredUserData != undefined) {
        if (trade_object.user_id == user_id) {
            if (trade_object.side == 'Buy') {
                collectedAmount = parseFloat(trade_object.taker_fee + (trade_object.quantity * trade_object.taker_fee * (referral_percentage / 100)))
                collectCoin = trade_object.settle_currency;
                coinData = await coinsModel
                    .query()
                    .first()
                    .select()
                    .where("deleted_at", null)
                    .andWhere("is_active", true)
                    .andWhere("coin", trade_object.settle_currency)
                    .orderBy("id", "DESC");

                addRefferalAddData.coin_id = coinData.id;
                addRefferalAddData.amount = collectedAmount;
                addRefferalAddData.coin_name = collectCoin;
                addRefferalAddData.user_id = referredUserData.id;
                addRefferalAddData.referred_user_id = referralData.id;
                addRefferalAddData.txid = transaction_id;
                addRefferalAddData.is_collected = false;

                var addedData = await ReferralModel.create({
                    ...addRefferalAddData
                })
            } else if (trade_object.side == 'Sell') {
                collectedAmount = parseFloat(trade_object.taker_fee + (trade_object.fill_price * trade_object.quantity * trade_object.taker_fee * (referral_percentage / 100)))
                collectCoin = trade_object.currency;

                coinData = await coinsModel
                    .query()
                    .first()
                    .select()
                    .where("deleted_at", null)
                    .andWhere("is_active", true)
                    .andWhere("coin", trade_object.currency)
                    .orderBy("id", "DESC");

                addRefferalAddData.coin_id = coinData.id;
                addRefferalAddData.amount = collectedAmount;
                addRefferalAddData.coin_name = collectCoin;
                addRefferalAddData.user_id = referredUserData.id;
                addRefferalAddData.referred_user_id = referralData.id;
                addRefferalAddData.txid = transaction_id;
                addRefferalAddData.is_collected = false;

                var addedData = await ReferralModel.create({
                    ...addRefferalAddData
                })
            }
        } else if (trade_object.requested_user_id == user_id) {
            if (trade_object.side == "Buy") {
                collectedAmount = parseFloat(trade_object.maker_fee + (trade_object.fill_price * trade_object.quantity * trade_object.maker_fee * (referral_percentage / 100)))
                collectCoin = trade_object.currency;

                coinData = await coinsModel
                    .query()
                    .first()
                    .select()
                    .where("deleted_at", null)
                    .andWhere("is_active", true)
                    .andWhere("coin", trade_object.currency)
                    .orderBy("id", "DESC");

                addRefferalAddData.coin_id = coinData.id;
                addRefferalAddData.amount = collectedAmount;
                addRefferalAddData.coin_name = collectCoin;
                addRefferalAddData.user_id = referredUserData.id;
                addRefferalAddData.referred_user_id = referralData.id;
                addRefferalAddData.txid = transaction_id;
                addRefferalAddData.is_collected = false;

                var addedData = await ReferralModel.create({
                    ...addRefferalAddData
                })
            } else if (trade_object.side == "Sell") {
                collectedAmount = parseFloat(trade_object.maker_fee + (trade_object.quantity * trade_object.maker_fee * (referral_percentage / 100)))
                collectCoin = trade_object.settle_currency;

                coinData = await coinsModel
                    .query()
                    .first()
                    .select()
                    .where("deleted_at", null)
                    .andWhere("is_active", true)
                    .andWhere("coin", trade_object.settle_currency)
                    .orderBy("id", "DESC");

                addRefferalAddData.coin_id = coinData.id;
                addRefferalAddData.amount = collectedAmount;
                addRefferalAddData.coin_name = collectCoin;
                addRefferalAddData.user_id = referredUserData.id;
                addRefferalAddData.referred_user_id = referralData.id;
                addRefferalAddData.txid = transaction_id;
                addRefferalAddData.is_collected = false;

                var addedData = await ReferralModel.create({
                    ...addRefferalAddData
                })
            }
        }
    }
}

module.exports = {
    getAmount
}
