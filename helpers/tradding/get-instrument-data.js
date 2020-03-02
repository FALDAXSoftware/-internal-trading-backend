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
        .where('name', 'like', '%-' + currency + "%")
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

        var tradeData = await TradeHistoryModel
            .query()
            .where('symbol', instrumentData[i].name)
            .andWhere('deleted_at', null)
            .andWhere('created_at', '>=', yesterday)
            .andWhere('created_at', '<=', now)
            .orderBy('id', 'DESC');

        var lastTradePrice = 0;
        if (tradeData.length > 0) {
            lastTradePrice = tradeData[0]['fill_price'];
        } else {
            lastTradePrice = 0;
        }
        for (var j = 0; j < tradeData.length; j++) {
            total_volume = total_volume + tradeData[j]['quantity'];
        }
        if (tradeData.length == 0) {
            current_price = 0
        } else {
            current_price = tradeData[0]['fill_price']
        }
        if (tradeData.length == 0) {
            previous_price = 0;
        } else {
            previous_price = tradeData[tradeData.length - 1]['fill_price'];
        }

        var diffrence = current_price - previous_price
        var percentChange = (diffrence / current_price) * 100;

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
    return pairData;
}

module.exports = {
    getInstrumentData
}