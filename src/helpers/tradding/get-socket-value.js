var moment = require('moment');
var TradeHistoryModel = require("../../models/TradeHistory");
var CurrencyConversionModel = require("../../models/CurrencyConversion");
var Currency = require("../../helpers/currency");

var getSocketValueData = async (pair) => {
    var pairData = [];
    var now = moment
        .utc()
        .format();
    var yesterday = moment
        .utc(now)
        .subtract(1, 'days')
        .format();

    let { crypto, currency } = await Currency.get_currencies(pair);

    var fiatValueSql = await CurrencyConversionModel.knex().raw(`SELECT json(quote->'USD'->'price') as fiat_value FROM currency_conversion
                            WHERE deleted_at IS NULL AND symbol LIKE '%${currency}%';`);
    fiatValueSql = fiatValueSql.rows[0];
    // console.log("fiatValueSql", fiatValueSql)

    var priceValue = await TradeHistoryModel.knex().raw(`SELECT max(fill_price) as high, min(fill_price) as low, SUM(quantity * fill_price) as volume
                                                            FROM trade_history
                                                            WHERE deleted_at IS NULL AND symbol LIKE '%${pair}%'
                                                            AND created_at <= '${now}' AND created_at >= '${yesterday}'`)
    priceValue = priceValue.rows[0]

    var firstPriceValue = await TradeHistoryModel.knex().raw(`SELECT trade_history.fill_price, coins.coin_name, coins.coin_icon, trade_history.side
                                                                FROM trade_history
                                                                LEFT JOIN coins
                                                                ON coins.coin = trade_history.settle_currency
                                                                WHERE trade_history.deleted_at IS NULL AND trade_history.symbol LIKE '%${pair}%'
                                                                AND trade_history.created_at <= '${now}' AND trade_history.created_at >= '${yesterday}'
                                                                ORDER BY trade_history.id DESC
                                                                LIMIT 1`)
    firstPriceValue = firstPriceValue.rows[0]

    var lastPriceValue = await TradeHistoryModel.knex().raw(`SELECT trade_history.fill_price, coins.coin, coins.coin_icon
                                                                FROM trade_history
                                                                LEFT JOIN coins
                                                                ON coins.coin = trade_history.currency
                                                                WHERE trade_history.deleted_at IS NULL AND trade_history.symbol LIKE '%${pair}%' 
                                                                AND trade_history.created_at <= '${now}' AND trade_history.created_at >= '${yesterday}'
                                                                ORDER BY trade_history.id ASC
                                                                LIMIT 1`)
    lastPriceValue = lastPriceValue.rows[0]
    var diffrence = firstPriceValue.fill_price - lastPriceValue.fill_price
    var percentChange = (diffrence / lastPriceValue.fill_price) * 100;

    if (isNaN(percentChange)) {
        percentChange = 0;
    } else if (percentChange == '-Infinity') {
        percentChange = 0;
    } else {
        percentChange = percentChange;
    }

    var data = {
        "last_price": firstPriceValue.fill_price,
        "change": percentChange,
        "high": priceValue.high,
        "low": priceValue.low,
        "volume": priceValue.volume,
        "name": pair,
        "icon": firstPriceValue.coin_icon,
        "base_currency": lastPriceValue.coin,
        "coin_name": firstPriceValue.coin_name,
        "side": firstPriceValue.side,
        "fiatValue": parseFloat(fiatValueSql.fiat_value * firstPriceValue.fill_price)
    }

    return (data);
}

module.exports = {
    getSocketValueData
}