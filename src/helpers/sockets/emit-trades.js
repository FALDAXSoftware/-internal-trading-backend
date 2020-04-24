/*
Emit Socket
*/
var BuyBookOrderHelper = require("../../helpers/buy/get-buy-book-order");
var SellBookOrderHelper = require("../../helpers/sell/get-sell-book-order");
var BuyBookOrderHelperSummary = require("../../helpers/buy/get-buy-book-order-summary");
var SellBookOrderHelperSummary = require("../../helpers/sell/get-sell-book-order-summary");
var TradeDetailsHelper = require("../../helpers/trade/get-trade-details");
var DashboardCardDetailsHelper = require("../../helpers/dashboard/get-card-data");
var ChartHelper = require("../../helpers/chart/get-depth-chart-detail");
var InstrumentHelper = require("../../helpers/tradding/get-instrument-data");
var UserWalletBalanceHelper = require("../../helpers/tradding/get-user-wallet-balance");
var AllPendingOrders = require("../../helpers/tradding/get-all-pending-orders");
var constants = require("../../config/constants");
var emitTrades = async (crypto, currency, userIds) => {
    let buyBookDetails = await BuyBookOrderHelperSummary.getBuyBookOrderSummary(crypto, currency);
    global.io.sockets.to(crypto + "-" + currency).emit(constants.TRADE_BUY_BOOK_EVENT, buyBookDetails)
    // sails
    //   .sockets
    //   .broadcast(inputs.crypto + "-" + inputs.currency, "buybookUpdate", buyBookDetails);
    let sellBookDetails = await SellBookOrderHelperSummary.sellOrderBookSummary(crypto, currency);
    global.io.sockets.to(crypto + "-" + currency).emit(constants.TRADE_SELL_BOOK_EVENT, sellBookDetails)
    // sails
    //   .sockets
    //   .broadcast(inputs.crypto + "-" + inputs.currency, "sellbookUpdate", sellBookDetails);
    let tradeDetails = await TradeDetailsHelper.getTradeDetails(crypto, currency, 100);
    global.io.sockets.to(crypto + "-" + currency).emit(constants.TRADE_TRADE_HISTORY_EVENT, tradeDetails)
    // sails
    //   .sockets
    //   .broadcast(inputs.crypto + "-" + inputs.currency, "tradehistoryUpdate", tradeDetails);
    let cardDate = await DashboardCardDetailsHelper.getCardData(crypto + "-" + currency);
    global.io.sockets.to(crypto + "-" + currency).emit(constants.TRADE_CARD_EVENT, cardDate)
    // sails
    //   .sockets
    //   .broadcast(inputs.crypto + "-" + inputs.currency, "cardDataUpdate", cardDate);
    let depthChartData = await ChartHelper.getDepthChartDetails(crypto, currency);
    global.io.sockets.to(crypto + "-" + currency).emit(constants.TRADE_DEPTH_CHART_EVENT, depthChartData)
    // sails
    //   .sockets
    //   .broadcast(inputs.crypto + "-" + inputs.currency, "depthChartUpdate", depthChartData);

    var cryptoInstrumentUpdate = await InstrumentHelper.getInstrumentData(currency);
    global.io.sockets.emit(constants.TRADE_INSTRUMENT_EVENT, cryptoInstrumentUpdate)
    // sails
    //   .sockets
    //   .broadcast(inputs.currency, "instrumentUpdate", cryptoInstrumentUpdate);

    // Get only unique user ids
    var filteredUsers = userIds.filter(function (item, pos) {
        return userIds
            .indexOf(item) == pos;
    });

    // Broadcast balance update for all user
    for (let index = 0; index < filteredUsers.length; index++) {
        console.log(filteredUsers)
        const element = filteredUsers[index];
        let userBalanceDetails = await UserWalletBalanceHelper.getUserWalletBalance(element, currency, crypto);
        global.io.sockets.to(crypto + "-" + currency + element).emit("user-wallet-balance", userBalanceDetails)


        global.io.sockets.to(crypto + "-" + currency + element).emit("users-completed-flag", true)
        // sails
        //   .sockets
        //   .broadcast(inputs.crypto + "-" + inputs.currency + "-" + element, "walletBalanceUpdate", userBalanceDetails);
    }

    var allpendingOrders = await AllPendingOrders.getAllPendingOrders(crypto, currency)
    global.io.sockets.emit(constants.TRADE_ALL_PENDING_ORDERS_EVENT, allpendingOrders)
    // sails
    //   .sockets
    //   .broadcast(inputs.crypto + "-" + inputs.currency, "orderUpdated", {
    //     crypto: inputs.crypto,
    //     currency: inputs.currency
    //   });

}

module.exports = {
    emitTrades
}