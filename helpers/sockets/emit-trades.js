/*
Emit Socket
*/
var BuyBookOrderHelper = require("../../helpers/buy/get-buy-book-order");
var SellBookOrderHelper = require("../../helpers/sell/get-sell-book-order");
var TradeDetailsHelper = require("../../helpers/trade/get-trade-details");
var DashboardCardDetailsHelper = require("../../helpers/dashboard/get-card-data");
var ChartHelper = require("../../helpers/chart/get-depth-chart-detail");
var InstrumentHelper = require("../../helpers/tradding/get-instrument-data");
var UserWalletBalanceHelper = require("../../helpers/tradding/get-user-wallet-balance");
var emitTrades = async (crypto, currency, userIds) => {
    let buyBookDetails = await BuyBookOrderHelper.getBuyBookOrder( crypto, currency );
    // sails
    //   .sockets
    //   .broadcast(inputs.crypto + "-" + inputs.currency, "buybookUpdate", buyBookDetails);
    let sellBookDetails = await SellBookOrderHelper.sellOrderBook(crypto, currency);
    // sails
    //   .sockets
    //   .broadcast(inputs.crypto + "-" + inputs.currency, "sellbookUpdate", sellBookDetails);
    let tradeDetails = await TradeDetailsHelper.getTradeDetails(crypto, currency, 100);
    // sails
    //   .sockets
    //   .broadcast(inputs.crypto + "-" + inputs.currency, "tradehistoryUpdate", tradeDetails);
    let cardDate = await DashboardCardDetailsHelper.getCardData(crypto + "-" + currency);
    // sails
    //   .sockets
    //   .broadcast(inputs.crypto + "-" + inputs.currency, "cardDataUpdate", cardDate);
    let depthChartData = await ChartHelper.getDepthChartDetails(crypto, currency);
    // sails
    //   .sockets
    //   .broadcast(inputs.crypto + "-" + inputs.currency, "depthChartUpdate", depthChartData);

    var cryptoInstrumentUpdate = await InstrumentHelper.getInstrumentData(currency);
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
        // sails
        //   .sockets
        //   .broadcast(inputs.crypto + "-" + inputs.currency + "-" + element, "walletBalanceUpdate", userBalanceDetails);
    }

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