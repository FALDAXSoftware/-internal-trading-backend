var tradeDetails = require("./trade/get-trade-details");
var lastPrice = require("./trade/get-last-trade-price");
var buyOrder = require("./buy/get-buy-book-order");
var sellOrder = require("./sell/get-sell-book-order");

var getLastTradePrice = async (crypto, currency) => {

    var tradeHistoryCount = await tradeDetails.getTradeDetails(crypto, currency, 1);
    var lastTradePrice = 0.0;
    if (tradeHistoryCount.length == 0) {
        var buyBook = await buyOrder.getBuyBookOrder(crypto, currency);
        var buyBookData = buyBook[0].fill_price || 0;
        var sellBook = await sellOrder.sellOrderBook(crypto, currency);
        var sellBookData = sellBook[0].fill_price || 0;
        lastTradePrice = parseFloat((buyBookData + sellBookData) / 2);
    } else {
        var tradeData = await lastPrice.getLastPrice(crypto, currency);
        console.log(tradeData)
        lastTradePrice = tradeData.fill_price;
    }
    return (lastTradePrice);
}

module.exports = {
    getLastTradePrice
}