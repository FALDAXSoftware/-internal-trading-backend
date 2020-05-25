var tradeDetails = require("./trade/get-trade-details");
var lastPrice = require("./trade/get-last-trade-price");
var buyOrder = require("./buy/get-buy-book-order");
var sellOrder = require("./sell/get-sell-book-order");

var getLastTradePrice = async (crypto, currency) => {
    console.log("crypto, currency", crypto, currency)
    var tradeHistoryCount = await tradeDetails.getTradeDetails(crypto, currency, 1);
    console.log("tradeHistoryCount", tradeHistoryCount)
    var lastTradePrice = 0.0;
    console.log("tradeHistoryCount.length", tradeHistoryCount.length)
    if (tradeHistoryCount.length == 0) {
        var buyBook = await buyOrder.getBuyBookOrder(crypto, currency);
        var buyBookData = buyBook[0].fill_price || 0;
        var sellBook = await sellOrder.sellOrderBook(crypto, currency);
        var sellBookData = sellBook[0].fill_price || 0;
        lastTradePrice = parseFloat((buyBookData + sellBookData) / 2);
    } else {
        console.log("INSIDE ELSE")
        // var tradeData = await lastPrice.getLastPrice(crypto, currency);
        // console.log(JSON.stringify(tradeData))
        lastTradePrice = tradeHistoryCount[0].fill_price;
    }
    return (lastTradePrice);
}

module.exports = {
    getLastTradePrice
}