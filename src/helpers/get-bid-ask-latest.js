var sellBookHelper = require("./sell/get-sell-book-order-summary");
var buyBookHelper = require("./buy/get-buy-book-order-summary");
var TradeHistoryModel = require("../models/TradeHistory");
var Currency = require("./currency");
var PairsModel = require("../models/Pairs");
var CurrencyConversionModel = require("../models/CurrencyConversion");

var getLatestVaue = async (symbol) => {
    var bidPrice = 0.0;
    var askPrice = 0.0;
    var lastPrice = 0.0;
    let { crypto, currency } = await Currency.get_currencies(symbol);
    var bidValue = await buyBookHelper.getBuyBookOrderSummary(crypto, currency);
    bidPrice = (bidValue.data.length == 0) ? (0.0) : (bidValue.data[0].price)
    var askValue = await sellBookHelper.sellOrderBookSummary(crypto, currency);
    askPrice = (askValue.data.length == 0) ? (0.0) : (askValue.data[0].price);

    var getTradeData = await TradeHistoryModel
        .query()
        .first()
        .select("fill_price")
        .where("deleted_at", null)
        .andWhere("settle_currency", crypto)
        .andWhere("currency", currency)
        .orderBy("id", "DESC");

    lastPrice = (getTradeData != undefined) ? (getTradeData.fill_price) : (0.0);

    var getPairDetails = await PairsModel
        .query()
        .first()
        .select("name", "order_maximum")
        .where("deleted_at", null)
        .andWhere("name", symbol)
        .orderBy("id", "DESC");

    // var USDPriceValue = await CurrencyConversionModel
    //     .query()
    //     .first()
    //     .select("quote")
    //     .where("deleted_at", null)
    //     .andWhere("symbol", "LIKE", '%' + crypto + '%')
    //     .orderBy("id", "DESC");
    // var usdValue = USDPriceValue.quote.USD.price

    var buyValue = ((bidValue.total_quantity) * ((getPairDetails.order_maximum) / 100));
    var buyMaximumValue = (bidValue.data.length == 0) ? (0.0) : parseFloat(buyValue).toFixed(8)

    var sellValue = ((askValue.total) * ((getPairDetails.order_maximum) / 100));
    var sellMaximumValue = (askValue.data.length == 0) ? (0.0) : (sellValue).toFixed(8);

    var data = {
        askPrice: askPrice,
        bidPrice: bidPrice,
        buyMaximumValue: sellMaximumValue,
        sellMaximumValue: buyMaximumValue,
        lastPrice: lastPrice
    }

    return (data);

}

module.exports = {
    getLatestVaue
}