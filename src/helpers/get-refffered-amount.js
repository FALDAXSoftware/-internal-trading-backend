var UserModel = require("../models/UsersModel");
var AdminSettingModel = require("../models/AdminSetting");
var coinsModel = require("../models/Coins");
var ReferralModel = require("../models/Referral");

var getAmount = async (trade_object, user_id, transaction_id) => {
    // console.log("user_id, transaction_id", user_id, transaction_id)
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
    // console.log("referredUserData", JSON.stringify(referredUserData));
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
    // console.log("referralData", referralData)
    // console.log("referredUserData", referredUserData)
    // console.log("referral_percentage", referral_percentage);
    if (referredUserData != undefined) {
        // console.log("user_id", user_id);
        // console.log("trade_object", JSON.stringify(trade_object));
        if (trade_object.user_id == user_id) {
            if (trade_object.side == 'Buy') {
                // console.log("trade_object.user_fee", trade_object.user_fee)
                collectedAmount = parseFloat(trade_object.user_fee - (trade_object.quantity * trade_object.user_fee * (referral_percentage / 100)))
                // console.log("collectedAmount", collectedAmount)
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
                addRefferalAddData.referral_percentage = referral_percentage

                var addedData = await ReferralModel
                    .query()
                    .insertAndFetch({
                        ...addRefferalAddData
                    })
            } else if (trade_object.side == 'Sell') {
                // console.log("trade_object.user_fee", trade_object.user_fee)
                collectedAmount = parseFloat(trade_object.user_fee - (trade_object.fill_price * trade_object.quantity * trade_object.user_fee * (referral_percentage / 100)))
                // console.log("collectedAmount", collectedAmount)
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
                addRefferalAddData.referral_percentage = referral_percentage

                var addedData = await ReferralModel
                    .query()
                    .insertAndFetch({
                        ...addRefferalAddData
                    })
            }
        } else if (trade_object.requested_user_id == user_id) {
            if (trade_object.side == "Buy") {
                // console.log("collectedAmount", collectedAmount)
                collectedAmount = parseFloat(trade_object.requested_fee - (trade_object.fill_price * trade_object.quantity * trade_object.requested_fee * (referral_percentage / 100)))
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
                addRefferalAddData.referral_percentage = referral_percentage

                var addedData = await ReferralModel
                    .query()
                    .insertAndFetch({
                        ...addRefferalAddData
                    })
            } else if (trade_object.side == "Sell") {
                // console.log("collectedAmount", collectedAmount)
                collectedAmount = parseFloat(trade_object.requested_fee - (trade_object.quantity * trade_object.requested_fee * (referral_percentage / 100)))
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
                addRefferalAddData.referral_percentage = referral_percentage

                var addedData = await ReferralModel
                    .query()
                    .insertAndFetch({
                        ...addRefferalAddData
                    })
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    } else {
        return 0;
    }
}

module.exports = {
    getAmount
}
