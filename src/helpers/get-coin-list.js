var CoinsModel = require("../models/Coins");
var PairModel = require("../models/Pairs");
var lastPrice = require("../helpers/trade/get-last-trade-price");
var Currency = require("./currency");

var coinData = async () => {
    var totalValue = [];
    var activeCoinList = await CoinsModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('is_active', true)
        .orderBy('id', 'DESC');

    totalValue.push(activeCoinList);

    var activePairList = await PairModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('is_active', true)
        .andWhere('symbol', '<>', null)
        .orderBy('id', 'DESC');

    if (activePairList && activePairList.length != undefined) {
        for (var i = 0; i < activePairList.length; i++) {
            // console.log("activePairList", JSON.stringify(activePairList));
            let { crypto, currency } = await Currency.get_currencies(activePairList[i].symbol);
            var lastPriceData = await lastPrice.getLastPrice(crypto, currency);
            activePairList[i].last_price = lastPriceData[0].fill_price;
        }
    }

    totalValue.push(activePairList);

    return (totalValue);

}

module.exports = {
    coinData
}