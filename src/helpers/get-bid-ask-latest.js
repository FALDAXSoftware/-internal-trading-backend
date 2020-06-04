var sellBookHelper = require("./sell/get-sell-book-order");
var buyBookHelper = require("./buy/get-buy-book-order");
var TradeHistoryModel = require("../models/TradeHistory");
var Currency = require("./currency");
var PairsModel = require("../models/Pairs");
var CurrencyConversionModel = require("../models/CurrencyConversion");

var getLatestVaue = async (symbol) => {
    var bidPrice = 0.0;
    var askPrice = 0.0;
    var lastPrice = 0.0;
    let { crypto, currency } = await Currency.get_currencies(symbol);
    var bidValue = await buyBookHelper.getBuyBookOrder(crypto, currency);
    bidPrice = (bidValue.length == 0) ? (0.0) : (bidValue[0].price)
    var askValue = await sellBookHelper.sellOrderBook(crypto, currency);
    askPrice = (askValue.length == 0) ? (0.0) : (askValue[0].price);

    var getTradeData = await TradeHistoryModel
        .query()
        .first()
        .select("fill_price")
        .where("deleted_at", null)
        .andWhere("settle_currency", crypto)
        .andWhere("currency", currency)
        .orderBy("id", "DESC");

    // console.log("getTradeData", getTradeData)

    lastPrice = (getTradeData != undefined) ? (getTradeData.fill_price) : (0.0);

    var getPairDetails = await PairsModel
        .query()
        .first()
        .select("name", "order_maximum")
        .where("deleted_at", null)
        .andWhere("name", symbol)
        .orderBy("id", "DESC");

    var USDPriceValue = await CurrencyConversionModel
        .query()
        .first()
        .select("quote")
        .where("deleted_at", null)
        .andWhere("symbol", "LIKE", '%' + crypto + '%')
        .orderBy("id", "DESC");
    var usdValue = USDPriceValue.quote.USD.price
    var maximumValue = (getPairDetails.order_maximum) / (usdValue)

    var data = {
        askPrice: askPrice,
        bidPrice: bidPrice,
        maximumValue: maximumValue,
        lastPrice: lastPrice
    }

    return (data);

}

module.exports = {
    getLatestVaue
}