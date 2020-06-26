var moment = require('moment');
var TradeHistoryModel = require("../../models/TradeHistory");
var CurrencyConversionModel = require("../../models/CurrencyConversion");
var Currency = require("../../helpers/currency");

// Redis
const redis = require("redis");
const axios = require("axios");
const port_redis = 6379;
const { promisify } = require("util");

const asyncRedis = require("async-redis");
const redis_client = asyncRedis.createClient({
    port: process.env.REDIS_PORT,               // replace with your port
    host: process.env.REDIS_HOST,        // replace with your hostanme or IP address
    password: process.env.REDIS_PASSWORD   // replace with your password
});

var getSocketValueData = async (pair) => {
    try {
        var now = moment
            .utc()
            .format();
        var yesterday = moment
            .utc(now)
            .subtract(1, 'days')
            .format();

        let { crypto, currency } = await Currency.get_currencies(pair);
        var fiatValueSqlData;
        var priceValue;
        var firstPriceValue;
        var lastPriceValue;

        await Promise.all([
            await CurrencyConversionModel.knex().raw(`SELECT json(quote->'USD'->'price') as fiat_value, coins.coin_name, 
                                                                        coins.coin_icon, coins.coin, coins.coin_code
                                                                        FROM currency_conversion
                                                                        LEFT JOIN coins
                                                                        ON coins.coin = currency_conversion.symbol
                                                                        WHERE currency_conversion.deleted_at IS NULL AND (currency_conversion.symbol = '${currency}' OR currency_conversion.symbol = '${crypto}');`),

            await TradeHistoryModel.knex().raw(`SELECT max(fill_price) as high, min(fill_price) as low, SUM(quantity * fill_price) as volume
                                                                        FROM trade_history
                                                                        WHERE deleted_at IS NULL AND symbol = '${pair}'
                                                                        AND created_at <= '${now}' AND created_at >= '${yesterday}'
                                                                        LIMIT 1;`),
            await TradeHistoryModel
                .query()
                .select("trade_history.fill_price", "coins.coin_name", "coins.coin_icon", "trade_history.side")
                .leftJoin('coins', "coins.coin", "trade_history.settle_currency")
                .where("trade_history.deleted_at", null)
                .andWhere("trade_history.symbol", pair)
                .andWhere("trade_history.created_at", ">=", yesterday)
                .andWhere("trade_history.created_at", '<=', now)
                .orderBy("trade_history.id", "DESC")
                .limit(1),

            await TradeHistoryModel
                .query()
                .select("trade_history.fill_price", "coins.coin_name", "coins.coin_icon", "trade_history.side")
                .leftJoin('coins', "coins.coin", "trade_history.settle_currency")
                .where("trade_history.deleted_at", null)
                .andWhere("trade_history.symbol", pair)
                .andWhere("trade_history.created_at", ">=", yesterday)
                .andWhere("trade_history.created_at", '<=', now)
                .orderBy("trade_history.id", "ASC")
                .limit(1)
        ]).then(values => {
            fiatValueSqlData = values[0].rows;
            priceValue = values[1].rows[0];
            firstPriceValue = values[2];
            lastPriceValue = values[3];
        })

        var fiatValue = 0.0;
        var coin_name = '';
        var coin_icon = '';
        var currency_coin_name = '';
        var crypto_coin_code = '';
        var currency_coin_code = '';
        for (var i = 0; i < fiatValueSqlData.length; i++) {
            if (fiatValueSqlData[i].coin == currency) {
                fiatValue = fiatValueSqlData[i].fiat_value;
                currency_coin_name = fiatValueSqlData[i].coin_name;
                currency_coin_code = fiatValueSqlData[i].coin_code;
            } else if (fiatValueSqlData[i].coin == crypto) {
                coin_name = fiatValueSqlData[i].coin_name;
                coin_icon = fiatValueSqlData[i].coin_icon;
                crypto_coin_code = fiatValueSqlData[i].coin_code;
            }
        }

        firstPriceValue = firstPriceValue[0];
        lastPriceValue = lastPriceValue[0]
        var current_price = (firstPriceValue == undefined) ? 0.0 : (firstPriceValue.fill_price)
        var previous_price = (lastPriceValue == undefined) ? 0.0 : (lastPriceValue.fill_price)
        var diffrence = (current_price) - previous_price
        var percentChange = (diffrence / previous_price) * 100;

        if (isNaN(percentChange)) {
            percentChange = 0;
        } else if (percentChange == '-Infinity') {
            percentChange = 0;
        } else {
            percentChange = percentChange;
        }

        var data = {
            "last_price": current_price,
            "change": percentChange,
            "high": (priceValue.high == null) ? (0.0) : (priceValue.high),
            "low": (priceValue.low == null) ? (0.0) : (priceValue.low),
            "volume": (priceValue.volume == null) ? (0.0) : (priceValue.volume),
            "name": pair,
            "icon": coin_icon,
            "base_currency": previous_price,
            "coin_name": coin_name,
            "side": (firstPriceValue == undefined) ? ("Buy") : (firstPriceValue.side),
            "fiatValue": parseFloat(fiatValue * current_price),
            "crypto_coin_code": crypto_coin_code,
            "currency_coin_name": currency_coin_name,
            "currency_coin_code": currency_coin_code
        }

        // console.log("userWalletBalance", userWalletBalance)
        redis_client.setex(`high-info-${pair}`, 3000, JSON.stringify(data));

        return (data);
    } catch (error) {
        console.log((error))
    }
}

module.exports = {
    getSocketValueData
}