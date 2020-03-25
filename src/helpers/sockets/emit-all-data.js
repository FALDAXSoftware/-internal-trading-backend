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
var getCompletedOrdersData = async (data) => {
    var user_id = data.user_id; // need to get from Authorization
    var pair = (data.symbol).split("-");
    var crypto = pair[0];
    var currency = pair[1];
    var month = data.month;
    if (data.flag == 1) {
        let helper = require("../../helpers/tradding/get-completed-orders");
        let data = await helper.getCompletedOrders(user_id, crypto, currency, month);
        return data;
    } else if (flag == 2) {
        let helper = require("../../helpers/tradding/get-cancelled-orders");
        let data = await helper.getCancelledOrders(user_id, crypto, currency, month);
        return data;
    } else if (flag == 3) {
        let helper = require("../../helpers/tradding/get-pending-orders");
        let data = await helper.getPendingOrders(user_id, crypto, currency, month);
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

var getMarketValue = async () => {
    let helper = require("../../helpers/get-coin-list");
    let data = await helper.coinData();
    return data;
}

var getUserFavouritesData = async (user_id, socket_id) => {
    let helper = require("../../controllers/v1/UserFavourites");
    let data = await helper.getFavourites(user_id, socket_id);
    return data;
}

var getPortfolioData = async (user_id) => {
    let helper = require("../../controllers/v1/DashboardController");
    let data = await helper.getPortfolioData(user_id);
    return data;
}

var getActivityData = async (user_id) => {
    let helper = require("../../controllers/v1/DashboardController");
    let data = await helper.getActivityData(user_id);
    return data;
}

module.exports = {
    getBuyBookData,
    getSellBookData,
    getTradeHistoryData,
    getCardData,
    getDepthChartData,
    getInstrumentData,
    getCompletedOrdersData,
    getCancelledOrdersData,
    getPendingOrdersData,
    getMarketValue,
    getUserFavouritesData,
    getPortfolioData,
    getActivityData
}
