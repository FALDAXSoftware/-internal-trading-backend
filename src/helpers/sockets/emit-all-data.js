/*
* Listen and Emit all data in socket
* */

// Get Buy Book Data
var getBuyBookData = async (crypto, currency) => {
    let helper = require("../../helpers/buy/get-buy-book-order");
    let data = await helper.getBuyBookOrder(crypto, currency);
    return data;

}
// Get Sell Book Data
var getSellBookData = async (crypto, currency) => {
    let helper = require("../../helpers/sell/get-sell-book-order");
    let data = await helper.sellOrderBook(crypto, currency);
    return data;

}

// Get Trade history Data
var getTradeHistoryData = async (crypto, currency) => {
    let helper = require("../../helpers/trade/get-trade-details");;
    let data = await helper.getTradeDetails(crypto, currency);
    return data;
}

var getUserBalance = async (user_id, crypto, currency) => {
    let helper = require("../tradding/get-user-wallet-balance");
    let data = await helper.getUserWalletBalance(user_id, currency, crypto);
    return data;
}

// Get Card Data
var getCardData = async (symbol) => {
    let helper = require("../../helpers/dashboard/get-card-data");
    let data = await helper.getCardData(symbol);
    return data;
}

// Get Depth chart details
var getDepthChartData = async (crypto, currency) => {
    let helper = require("../../helpers/chart/get-depth-chart-detail");
    let data = await helper.getDepthChartDetails(crypto, currency);
    return data;
}

// Get Instrument details
var getInstrumentData = async (currency) => {
    let helper = require("../../helpers/tradding/get-instrument-data");
    let data = await helper.getInstrumentData(currency);
    return data;
}

// Get Users Completed Orders details
var getUserOrdersData = async (data) => {
    var user_id = data.user_id;
    var pair = (data.pair).split("-");
    var crypto = pair[0];
    var currency = pair[1];
    var month = data.month;
    if (data.flag == 1) {
        let helper = require("../../helpers/tradding/get-completed-orders");
        let data = await helper.getCompletedOrders(user_id, crypto, currency, month);
        return data;
    } else if (data.flag == 2) {
        let helper = require("../../helpers/tradding/get-pending-orders");
        let data = await helper.getPendingOrders(user_id, crypto, currency, month);
        return data;
    } else if (data.flag == 3) {
        let helper = require("../../helpers/tradding/get-cancelled-orders");
        let data = await helper.getCancelledOrders(user_id, crypto, currency, month);
        return data;
    }
}

// Get Users Cancelled Orders details
var getCancelledOrdersData = async (user_id, crypto, currency, month) => {
    let helper = require("../../helpers/tradding/get-cancelled-orders");
    let data = await helper.getCancelledOrders(user_id, crypto, currency, month);
    return data;
}

// Get Users Pending Orders details
var getPendingOrdersData = async (user_id, crypto, currency, month) => {
    let helper = require("../../helpers/tradding/get-pending-orders");
    let data = await helper.getPendingOrders(user_id, crypto, currency, month);
    return data;
}

// Get Market Value
var getMarketValue = async () => {
    let helper = require("../../helpers/get-coin-list");
    let data = await helper.coinData();
    return data;
}

// Get user favouite data
var getUserFavouritesData = async (user_id, socket_id) => {
    let helper = require("../../controllers/v1/UserFavourites");
    let data = await helper.getFavourites(user_id, socket_id);
    return data;
}

// Get Portfolio data
var getPortfolioData = async (user_id) => {
    let helper = require("../../controllers/v1/DashboardController");
    let data = await helper.getPortfolioData(user_id);
    return data;
}

// Get Activity Data
var getActivityData = async (user_id) => {
    console.log(user_id)
    let helper = require("../../controllers/v1/DashboardController");
    let data = await helper.getActivityData(user_id);
    return data;
}

module.exports = {
    getBuyBookData,
    getSellBookData,
    getTradeHistoryData,
    getUserBalance,
    getCardData,
    getDepthChartData,
    getInstrumentData,
    getUserOrdersData,
    getCancelledOrdersData,
    getPendingOrdersData,
    getMarketValue,
    getUserFavouritesData,
    getPortfolioData,
    getActivityData
}
