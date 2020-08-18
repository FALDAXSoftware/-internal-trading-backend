var TradeHistoryModel = require("../models/TradeHistory");
var UsersModel = require("../models/UsersModel");
var moment = require('moment');
var TierModel = require("../models/Tiers");
var CurrencyConversionModel = require("../models/CurrencyConversion");

var userTier0Report = async (user_id, amount, crypto) => {
    try {
        var data = {}
        var usersData = await UsersModel
            .query()
            .first()
            .select("account_verified_at", "account_tier")
            .where("deleted_at", null)
            .andWhere("is_active", true)
            .andWhere("id", user_id)
            .orderBy("id", "DESC");

        console.log("usersData", usersData)

        console.log("usersData.account_tier", usersData.account_tier)

        if (usersData.account_tier == 0) {

            var getTierDetails = await TierModel
                .query()
                .select()
                .where("deleted_at", null)
                .andWhere("is_active", true)
                .andWhere("tier_step", usersData.account_tier)
                .orderBy("id", "DESC");

            console.log("getTierDetails", getTierDetails)

            if (getTierDetails != undefined && getTierDetails.length > 0) {
                var now = moment()
                    .local()
                    .format();

                console.log("now", now)

                console.log("getTierDetails[0].max_allowed_days", getTierDetails[0].max_allowed_days)

                var unlimitedFlag = false;
                if (getTierDetails[0].max_allowed_days != "Unlimited") {
                    var after30Days = moment(usersData.account_verified_at)
                        .add(parseFloat(getTierDetails[0].max_allowed_days), "day")
                        .local()
                        .format();
                } else {
                    unlimitedFlag = true;
                }

                console.log("unlimitedFlag", unlimitedFlag)

                if (unlimitedFlag == true || (moment(now).isBefore(after30Days))) {
                    var after1Day = moment(now)
                        .startOf('day')
                        .local()
                        .format();

                    var userTradeHistorySum = {}

                    var getTradeHistoryQuery = await TradeHistoryModel.knex().raw(`SELECT (a1.sum+a2.sum) as total, a1.sum as user_sum, a2.sum as requested_sum , a1.user_coin ,a2.requested_coin
                            FROM(SELECT user_coin, 
                                SUM((CASE
                                    WHEN side='Buy' THEN ((quantity)*Cast(fiat_values->>'asset_1_usd' as double precision))
                                    WHEN side='Sell' THEN ((quantity*fill_price)*Cast(fiat_values->>'asset_2_usd' as double precision))
                                END)) as sum
                                FROM trade_history
                            WHERE user_id = ${user_id} AND created_at >= '${after1Day}' AND created_at <= '${now}' GROUP BY user_coin) a1
                            FULL JOIN (SELECT requested_coin, 
                                SUM((CASE
                                    WHEN side='Buy' THEN ((quantity*fill_price)*Cast(fiat_values->>'asset_2_usd' as double precision))
                                    WHEN side='Sell' THEN ((quantity)*Cast(fiat_values->>'asset_1_usd' as double precision))
                                END)) as sum
                                FROM trade_history
                                WHERE requested_user_id = ${user_id} AND created_at >= '${after1Day}' AND created_at <= '${now}' GROUP BY requested_coin) as a2
                                ON a1.user_coin = a2.requested_coin`);

                    for (let index = 0; index < getTradeHistoryQuery.rows.length; index++) {
                        const element = getTradeHistoryQuery.rows[index];
                        userTradeHistorySum[element.user_coin ? element.user_coin : element.requested_coin] = element.total ? element.total : (element.user_sum ? element.user_sum : element.requested_sum)
                    }

                    console.log("userTradeHistorySum", userTradeHistorySum)

                    console.log("userTradeHistorySum", userTradeHistorySum)

                    var userTotalUSDSum = 0.0;

                    var getCurrenctConversionValue = await CurrencyConversionModel
                        .query()
                        .select()
                        .first()
                        .where("deleted_at", null)
                        .andWhere("symbol", crypto)
                        .orderBy("id", "DESC");

                    if (Object.keys(userTradeHistorySum).length != 0) {
                        var entries = Object.entries(userTradeHistorySum);
                        entries.forEach(([key, value]) => {
                            userTotalUSDSum += value
                        });
                    } else {
                        userTotalUSDSum = 0.0;
                    }

                    var usdValue = 0.0;
                    if (getCurrenctConversionValue != undefined) {
                        usdValue = parseFloat(amount) * parseFloat(getCurrenctConversionValue.quote.USD.price)
                    }

                    var dailyFlag = false;
                    if (getTierDetails[0].max_trade_amount == "Unlimited") {
                        dailyFlag = true;
                    }

                    if (dailyFlag == true) {
                        var subtractValue = parseFloat(userTotalUSDSum)
                        var value = {
                            "available_trade_limit_actual": "Unlimited",
                            "current_left_limit": "Unlimited",
                            "amount_left_after_trade": "Unlimited"
                        }
                        data.valueObject = value;
                        data.completedFlag = false;
                        data.completedFlagAfterTrade = false;
                        data.leftFlag = true;
                        data.tier_flag = true;
                        data.account_tier_flag = true;
                    } else if (parseFloat(userTotalUSDSum) >= parseFloat(getTierDetails[0].max_trade_amount)) {
                        var subtractValue = parseFloat(getTierDetails[0].max_trade_amount) - parseFloat(userTotalUSDSum)
                        var value = {
                            "available_trade_limit_actual": getTierDetails[0].max_trade_amount,
                            "current_left_limit": (parseFloat(subtractValue) > 0) ? (subtractValue) : (0.0),
                            "amount_left_after_trade": 0.0
                        }
                        data.valueObject = value;
                        data.completedFlag = true;
                        data.completedFlagAfterTrade = false;
                        data.leftFlag = false;
                        data.tier_flag = true;
                        data.account_tier_flag = true;
                    } else if ((parseFloat(userTotalUSDSum) + parseFloat(usdValue)) > parseFloat(getTierDetails[0].max_trade_amount)) {
                        var subtractValue = parseFloat(getTierDetails[0].max_trade_amount) - parseFloat(userTotalUSDSum)
                        var leftAmount = parseFloat(getTierDetails[0].max_trade_amount) - (parseFloat(userTotalUSDSum) + parseFloat(usdValue))
                        var value = {
                            "available_trade_limit_actual": getTierDetails[0].max_trade_amount,
                            "current_left_limit": (parseFloat(subtractValue) > 0) ? (subtractValue) : (0.0),
                            "amount_left_after_trade": (amount == 0) ? (0.0) : ((leftAmount < 0) ? (0.0) : (leftAmount))
                        }
                        data.valueObject = value;
                        data.completedFlag = false;
                        data.completedFlagAfterTrade = true;
                        data.leftFlag = false;
                        data.tier_flag = true;
                        data.account_tier_flag = true;
                    } else {
                        var subtractValue = parseFloat(getTierDetails[0].max_trade_amount) - parseFloat(userTotalUSDSum)
                        var value = {
                            "available_trade_limit_actual": getTierDetails[0].max_trade_amount,
                            "current_left_limit": (parseFloat(subtractValue) > 0) ? (subtractValue) : (0.0),
                            "amount_left_after_trade": (amount == 0) ? (0.0) : (parseFloat(getTierDetails[0].max_trade_amount) - (parseFloat(userTotalUSDSum) + parseFloat(usdValue)))
                        }
                        data.valueObject = value;
                        data.completedFlag = false;
                        data.completedFlagAfterTrade = false;
                        data.leftFlag = true;
                        data.tier_flag = true;
                        data.account_tier_flag = true;
                    }
                } else {
                    data.msg = "30 days completed. Please verify your Identity Verfication";
                    data.days = getTierDetails[0].max_allowed_days
                    data.response_flag = true;
                    data.tier_flag = true;
                    data.account_tier_flag = true;
                }
            } else {
                data.msg = "Tier Inactive. Complete ID verification";
                data.tier_flag = false;
                data.account_tier_flag = true;
            }
        } else {
            data.account_tier_flag = false;
        }

        // data.response_flag = true;
        // data.msg = "30 days completed. Please verify your Identity Verfication";

        console.log("data", data)

        return (data);

    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    userTier0Report
}