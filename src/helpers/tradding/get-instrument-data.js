/*
Get instrument data
*/
var moment = require('moment');
var PairsModel = require("../../models/Pairs");
var CoinsModel = require("../../models/Coins");
var TradeHistoryModel = require("../../models/TradeHistory");

var getInstrumentData = async () => {
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
        .select("name", "coin_code1", "coin_code2", "quantity_precision", "price_precision")
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

    var volumeSql = `SELECT sum(quantity * fill_price) as quantity, symbol
                        FROM trade_history 
                        WHERE deleted_at IS NULL
                        AND created_at >= '${yesterday}' AND created_at <= '${now}'
                        GROUP BY symbol`
    var quantityValue = await TradeHistoryModel.knex().raw(volumeSql);
    quantityValue = quantityValue.rows;
    var quantityObject = {}
    var data = quantityValue.map(person => {
        quantityObject[person.symbol] = person
    });

    var currentPriceSql = `SELECT fill_price, symbol
                            FROM trade_history
                            WHERE id IN (SELECT max(id)
                                            FROM trade_history 
                                            WHERE deleted_at IS NULL
                                            AND created_at >= '${yesterday}' AND created_at <= '${now}'
                                            GROUP BY symbol)`
    var currentValueSql = await TradeHistoryModel.knex().raw(currentPriceSql);
    currentValueSql = currentValueSql.rows;
    var currenctPriceObjcet = {}
    var data = currentValueSql.map(person => {
        currenctPriceObjcet[person.symbol] = person
    });

    var previousPriceSql = `SELECT fill_price, symbol
                                FROM trade_history
                                WHERE id IN (SELECT min(id)
                                                FROM trade_history 
                                                WHERE deleted_at IS NULL
                                                AND created_at >= '${yesterday}' AND created_at <= '${now}'
                                                GROUP BY symbol)`
    var previousValueSql = await TradeHistoryModel.knex().raw(previousPriceSql);
    previousValueSql = previousValueSql.rows;
    var previousPriceObjcet = {}
    var data = previousValueSql.map(person => {
        previousPriceObjcet[person.symbol] = person
    });

    for (var i = 0; i < instrumentData.length; i++) {
        let total_volume = quantityObject[instrumentData[i].name] ? (quantityObject[instrumentData[i].name].quantity) : (0.0);
        let current_price = currenctPriceObjcet[instrumentData[i].name] ? (currenctPriceObjcet[instrumentData[i].name].fill_price) : (0.0);
        let lastTradePrice = current_price;
        let previous_price = previousPriceObjcet[instrumentData[i].name] ? (previousPriceObjcet[instrumentData[i].name].fill_price) : (0.0);

        var diffrence = current_price - previous_price
        var percentChange = (diffrence / previous_price) * 100;

        if (isNaN(percentChange)) {
            percentChange = 0;
        } else if (percentChange == '-Infinity' || percentChange == 'Infinity') {
            percentChange = 0;
        } else if (percentChange == undefined) {
            percentChange = 0;
        }
        else {
            percentChange = percentChange;
        }

        var instrument_data = {
            "name": instrumentData[i].name,
            "last_price": lastTradePrice,
            "volume": total_volume,
            "percentChange": percentChange,
            "coin_icon": (coinList[instrumentData[i].coin_code1] != undefined && coinList[instrumentData[i].coin_code1].coin_icon != null ?
                coinList[instrumentData[i].coin_code1].coin_icon :
                ""),
            "quantity_precision": instrumentData[i].quantity_precision,
            "price_precision": instrumentData[i].price_precision
        }
        pairData.push(instrument_data);
    }
    return pairData;
}

module.exports = {
    getInstrumentData
}