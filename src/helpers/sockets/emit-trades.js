/*
Emit Socket
*/
var BuyBookOrderHelperSummary = require("../../helpers/buy/get-buy-book-order-summary");
var SellBookOrderHelperSummary = require("../../helpers/sell/get-sell-book-order-summary");
var TradeDetailsHelper = require("../../helpers/trade/get-trade-details");
var DashboardCardDetailsHelper = require("../../helpers/dashboard/get-card-data");
var ChartHelper = require("../../helpers/chart/get-depth-chart-detail");
var InstrumentHelper = require("../../helpers/tradding/get-instrument-data");
var UserWalletBalanceHelper = require("../../helpers/tradding/get-user-wallet-balance");
var AllPendingOrders = require("../../helpers/tradding/get-all-pending-orders");
var highLevelInfoData = require("../../helpers/tradding/get-socket-value");
var getLatestValue = require("../../helpers/get-bid-ask-latest");
var constants = require("../../config/constants");
var tier0Report = require("../tier-0-report");
var spreadData = require("../spread-value");


var emitTrades = async (crypto, currency, userIds) => {
    let buyBookDetails = await BuyBookOrderHelperSummary.getBuyBookOrderSummary(crypto, currency);
    global.io.sockets.to(crypto + "-" + currency).emit(constants.TRADE_BUY_BOOK_EVENT, buyBookDetails)

    let sellBookDetails = await SellBookOrderHelperSummary.sellOrderBookSummary(crypto, currency);
    global.io.sockets.to(crypto + "-" + currency).emit(constants.TRADE_SELL_BOOK_EVENT, sellBookDetails)

    let tradeDetails = await TradeDetailsHelper.getTradeDetails(crypto, currency, 100);
    global.io.sockets.to(crypto + "-" + currency).emit(constants.TRADE_TRADE_HISTORY_EVENT, tradeDetails)

    let symbol = crypto + "-" + currency
    let socketInfoData = await highLevelInfoData.getSocketValueData(symbol);
    global.io.sockets.to(crypto + "-" + currency).emit(constants.TRADE_HIGH_LEVEL_INFO, socketInfoData)

    let latesValue = await getLatestValue.getLatestVaue(symbol);
    global.io.sockets.to(crypto + '-' + currency).emit(constants.LATEST_TRADEVALUE, latesValue)

    global.io.sockets.to(crypto + "-" + currency).emit(constants.TRADE_SPREAD_VALUE, await spreadData.spreadData(symbol))

    console.log("userIds", userIds)

    // Get only unique user ids
    var filteredUsers = userIds.filter(function (item, pos) {
        return userIds
            .indexOf(item) == pos;
    });

    console.log("filteredUsers", filteredUsers)

    // Broadcast balance update for all user
    for (let index = 0; index < filteredUsers.length; index++) {
        // console.log(JSON.stringify(filteredUsers))
        const element = filteredUsers[index];
        console.log("element", element)
        let userBalanceDetails = await UserWalletBalanceHelper.getUserWalletBalance(element, currency, crypto);
        global.io.sockets.to(crypto + "-" + currency + element).emit("user-wallet-balance", userBalanceDetails)


        global.io.sockets.to(crypto + "-" + currency + element).emit("users-completed-flag", true)
    }
}

module.exports = {
    emitTrades
}