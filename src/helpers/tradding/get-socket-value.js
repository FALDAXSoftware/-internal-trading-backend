var moment = require('moment');
var TradeHistoryModel = require("../../models/TradeHistory");
var CurrencyConversionModel = require("../../models/CurrencyConversion");
var Currency = require("../../helpers/currency");

var getSocketValueData = async (pair) => {
    // var pairData = [];
    try {
        // console.log("pair", pair)
        var now = moment
            .utc()
            .format();
        var yesterday = moment
            .utc(now)
            .subtract(1, 'days')
            .format();

        // console.log("now", now)

        // console.log("yesterday", yesterday)

        let { crypto, currency } = await Currency.get_currencies(pair);
        var fiatValueSqlData = await CurrencyConversionModel.knex().raw(`SELECT json(quote->'USD'->'price') as fiat_value, coins.coin_name, 
                                                                        coins.coin_icon, coins.coin, coins.coin_code
                                                                        FROM currency_conversion
                                                                        LEFT JOIN coins
                                                                        ON coins.coin = currency_conversion.symbol
                                                                        WHERE currency_conversion.deleted_at IS NULL AND (currency_conversion.symbol = '${currency}' OR currency_conversion.symbol = '${crypto}');`);
        fiatValueSqlData = fiatValueSqlData.rows;
        // console.log("fiatValueSqlData", fiatValueSqlData)
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

        // console.log(`SELECT max(fill_price) as high, min(fill_price) as low, SUM(quantity * fill_price) as volume
        // FROM trade_history
        // WHERE deleted_at IS NULL AND symbol = '${pair}'
        // AND created_at <= '${now}' AND created_at >= '${yesterday}'`)

        var priceValue = await TradeHistoryModel.knex().raw(`SELECT max(fill_price) as high, min(fill_price) as low, SUM(quantity * fill_price) as volume
                                                            FROM trade_history
                                                            WHERE deleted_at IS NULL AND symbol = '${pair}'
                                                            AND created_at <= '${now}' AND created_at >= '${yesterday}'
                                                            LIMIT 1;`)

        // var priceValue = await TradeHistoryModel
        //     .query()
        //     .max("fill_price as high")
        //     .min("fill_price as low")
        //     .sum("(quantity * fill_price) as volume")
        //     // .select("max(fill_price) as high", "min(fill_price) as low", "SUM(quantity * fill_price) as volume")
        //     .where("deleted_at", null)
        //     .andWhere("symbol", pair)
        //     .andWhere("created_at", "<=", now)
        //     .andWhere("created_at", ">=", yesterday)
        //     .limit(1);

        // console.log("priceValue", priceValue)

        // var priceValue = await TradeHistoryModel.knex().raw(`SELECT max(fill_price) as high,
        //                                                         min(fill_price) as low,
        //                                                         SUM(quantity * fill_price) as volume
        //                                                         FROM trade_history
        //                                                         WHERE deleted_at IS NULL
        //                                                         AND symbol = '${pair}'
        //                                                         AND created_at between '${yesterday}' and '${now}'`)
        priceValue = priceValue.rows[0]
        // console.log("priceValue", priceValue)

        // var data = await TradeHistoryModel
        //     .query()
        //     .select()

        // var firstPriceValue = await TradeHistoryModel.knex().raw(`SELECT trade_history.fill_price, coins.coin_name, coins.coin_icon, trade_history.side
        //                                                         FROM trade_history
        //                                                         LEFT JOIN coins
        //                                                         ON coins.coin = trade_history.settle_currency
        //                                                         WHERE trade_history.deleted_at IS NULL AND trade_history.symbol = '${pair}'
        //                                                         AND trade_history.created_at >= '${yesterday}' AND trade_history.created_at <= '${now}'
        //                                                         ORDER BY trade_history.id DESC
        //                                                         LIMIT 1`)
        // firstPriceValue = firstPriceValue.rows[0]

        var firstPriceValue = await TradeHistoryModel
            .query()
            .select("trade_history.fill_price", "coins.coin_name", "coins.coin_icon", "trade_history.side")
            .leftJoin('coins', "coins.coin", "trade_history.settle_currency")
            .where("trade_history.deleted_at", null)
            .andWhere("trade_history.symbol", pair)
            .andWhere("trade_history.created_at", ">=", yesterday)
            .andWhere("trade_history.created_at", '<=', now)
            .orderBy("trade_history.id", "ASC")
            .limit(1);

        firstPriceValue = firstPriceValue[0]
        // console.log("firstPriceValue", firstPriceValue)

        // var lastPriceValue = await TradeHistoryModel.knex().raw(`SELECT trade_history.fill_price, coins.coin, coins.coin_icon
        //                                                         FROM trade_history
        //                                                         LEFT JOIN coins
        //                                                         ON coins.coin = trade_history.currency
        //                                                         WHERE trade_history.deleted_at IS NULL AND trade_history.symbol = '${pair}' 
        //                                                         AND trade_history.created_at >= '${yesterday}' AND trade_history.created_at <= '${now}'
        //                                                         ORDER BY trade_history.id ASC
        //                                                         LIMIT 1`)

        var lastPriceValue = await TradeHistoryModel
            .query()
            .select("trade_history.fill_price", "coins.coin", "coins.coin_icon")
            .leftJoin('coins', "coins.coin", "trade_history.currency")
            .where("trade_history.deleted_at", null)
            .andWhere("trade_history.symbol", pair)
            .andWhere("trade_history.created_at", ">=", yesterday)
            .andWhere("trade_history.created_at", '<=', now)
            .orderBy("trade_history.id", "ASC")
            .limit(1);

        // lastPriceValue = lastPriceValue.rows[0]
        lastPriceValue = lastPriceValue[0]
        // console.log("firstPriceValue", firstPriceValue);
        // console.log("lastPriceValue", lastPriceValue)
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

        // console.log("data", data)

        return (data);
    } catch (error) {
        console.log((error))
    }
}

module.exports = {
    getSocketValueData
}