/*
Get instrument data
*/
var moment = require('moment');
var PairsModel = require("../../models/Pairs");
var CoinsModel = require("../../models/Coins");
var TradeHistoryModel = require("../../models/TradeHistory");

var getInstrumentData = async (currency) => {
    var instrumentData;
    var pairData = [];
    var now = moment
        .utc()
        .format();
    var yesterday = moment
        .utc(now)
        .subtract(1, 'days')
        .format();

    instrumentData = await PairsModel
        .query()
        .select()
        // .where('name', 'like', '%-' + currency + "%")
        .andWhere('deleted_at', null)
        .andWhere('is_active', true);
    // Get Coin Data
    let coins = await CoinsModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('is_active', true);
    let coinList = {};
    for (let index = 0; index < coins.length; index++) {
        const element = coins[index];
        coinList[element.id] = element;
    }

    for (var i = 0; i < instrumentData.length; i++) {
        var total_volume = 0;
        var current_price = 0;
        var previous_price = 0;

        var quantitySql = `SELECT sum(quantity) as quantity, symbol
                            FROM trade_history 
                            WHERE symbol LIKE '%${instrumentData[i].name}%' AND deleted_at IS NULL
                            AND created_at >= '${yesterday}' AND created_at <= '${now}'
                            GROUP BY symbol`
        var quantityValue = await TradeHistoryModel.knex().raw(quantitySql);
        console.log("quantityValue", quantityValue)
        total_volume = (quantityValue.rows.length > 0) ? (quantityValue.rows[0].quantity) : 0.0;

        var currentPriceSql = `SELECT fill_price, symbol
                                FROM trade_history 
                                WHERE symbol LIKE '%${instrumentData[i].name}%' AND deleted_at IS NULL
                                AND created_at >= '${yesterday}' AND created_at <= '${now}'
                                ORDER BY id DESC
                                limit 1`
        var currenctPriceValue = await TradeHistoryModel.knex().raw(currentPriceSql);
        var lastTradePrice = (currenctPriceValue.rows.length > 0) ? (currenctPriceValue.rows[0].fill_price) : 0.0;
        current_price = (currenctPriceValue.rows.length > 0) ? (currenctPriceValue.rows[0].fill_price) : 0.0;

        var previousPriceSql = `SELECT fill_price, symbol
                                    FROM trade_history 
                                    WHERE symbol LIKE '%${instrumentData[i].name}%' AND deleted_at IS NULL
                                    AND created_at >= '${yesterday}' AND created_at <= '${now}'
                                    ORDER BY id ASC
                                    limit 1`

        var previousPriceValue = await TradeHistoryModel.knex().raw(previousPriceSql);
        previous_price = (previousPriceValue.rows.length > 0) ? (previousPriceValue.rows[0].fill_price) : 0.0;

        var diffrence = current_price - previous_price
        var percentChange = (diffrence / previous_price) * 100;

        if (isNaN(percentChange)) {
            percentChange = 0;
        } else if (percentChange == '-Infinity') {
            percentChange = 0;
        } else {
            percentChange = percentChange;
        }

        var instrument_data = {
            "name": instrumentData[i].name,
            "last_price": lastTradePrice,
            "volume": total_volume,
            "percentChange": percentChange,
            "coin_icon": (coinList[instrumentData[i].coin_code1] != undefined && coinList[instrumentData[i].coin_code1].coin_icon != null ?
                coinList[instrumentData[i].coin_code1].coin_icon :
                "")
        }
        pairData.push(instrument_data);
    }
    console.log("pairData", pairData)
    return pairData;
}

module.exports = {
    getInstrumentData
}