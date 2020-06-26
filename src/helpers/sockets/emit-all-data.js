/*
* Listen and Emit all data in socket
* */

// Redis
const redis = require("redis");
const axios = require("axios");
const port_redis = 6379;
const { promisify } = require("util");

const asyncRedis = require("async-redis");
const client = asyncRedis.createClient({
    port: process.env.REDIS_PORT,               // replace with your port
    host: process.env.REDIS_HOST,        // replace with your hostanme or IP address
    password: process.env.REDIS_PASSWORD   // replace with your password
});

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
// Get Buy Book Data
var getBuyBookDataSummary = async (crypto, currency) => {
    let helper = require("../../helpers/buy/get-buy-book-order-summary");
    let data = await helper.getBuyBookOrderSummary(crypto, currency);
    // console.log("data", data);
    return data;

}
// Get Sell Book Data
var getSellBookDataSummary = async (crypto, currency) => {
    let helper = require("../../helpers/sell/get-sell-book-order-summary");
    let data = await helper.sellOrderBookSummary(crypto, currency);
    return data;

}
// Get Trade history Data
var getTradeHistoryData = async (crypto, currency) => {
    // var value = await redis_client.get(`trade-data-${crypto}-${currency}`)
    // const getAsync = promisify(redis_client.get(`trade-data-${crypto}-${currency}`)).bind(redis_client);
    // getAsync.then(console.log).catch(console.error);
    // var value = await client.get(`trade-data-${crypto}-${currency}`);
    // console.log("value", value);

    // if (value == null) {
    //     let helper = require("../../helpers/trade/get-trade-details");;
    //     value = await helper.getTradeDetails(crypto, currency);
    // }
    //     , async (err, data) => {
    //     return new Promise(async (resolve, reject) => {
    //         console.log("INSIDE CACHING")
    //         if (err) {
    //             console.log(err);
    //             res.status(500).send(err);
    //         }
    //         //if no match found
    //         if (data != null) {
    //             console.log("RETUNING", data != null)
    //             console.log("data", JSON.parse(data))
    //             resolve(JSON.parse(data));
    //         } else {
    //             //proceed to next middleware function
    //             // app.use('/', require('./routes/index'));
    //             // next();
    //             // console.log("NO CACHE FOUND")
    let helper = require("../../helpers/trade/get-trade-details");;
    let data1 = await helper.getTradeDetails(crypto, currency);
    console.log("DATA returned")
    //             resolve(data1);
    //         }
    //     })
    // });
    // console.log("value", value)
    return (data1);
}

var getUserBalance = async (user_id, crypto, currency) => {

    var value = await client.get(`${user_id}-${crypto}-${currency}`);
    console.log("value", value);

    if (value == null) {
        let helper = require("../tradding/get-user-wallet-balance");
        value = await helper.getUserWalletBalance(user_id, currency, crypto);
    } else {
        value = JSON.parse(value);
        value.flag = true;
    }

    console.log("value", value);
    return value;
}

var getLatestValue = async (symbol) => {
    let helper = require("../../helpers/get-bid-ask-latest");
    let data = await helper.getLatestVaue(symbol);
    return data;
}

// Get Card Data
// var getCardData = async (symbol) => {
//     let helper = require("../../helpers/dashboard/get-card-data");
//     let data = await helper.getCardData(symbol);
//     return data;
// }

// Get Users Completed Orders details
var getUserOrdersData = async (data) => {
    var user_id = data.user_id;
    var pair = (data.pair).split("-");
    var crypto = pair[0];
    var currency = pair[1];
    var month = data.month;
    var limit = data.limit
    if (data.flag == 1) {
        let helper = require("../../helpers/tradding/get-completed-orders");
        let data = await helper.getCompletedOrders(user_id, crypto, currency, month);
        return data;
    } else if (data.flag == 2) {
        let helper = require("../../helpers/tradding/get-pending-orders");
        let data = await helper.getPendingOrders(user_id, crypto, currency, month, limit);
        return data;
    } else if (data.flag == 3) {
        let helper = require("../../helpers/tradding/get-cancelled-orders");
        let data = await helper.getCancelledOrders(user_id, crypto, currency, month);
        return data;
    }
}

// // Get All Pending Orders
// var getAllPendingOrders = async (crypto, currency) => {
//     let helper = require("../../helpers/tradding/get-all-pending-orders");
//     let data = await helper.getAllPendingOrders(crypto, currency);
//     return { data, id: process.env.TRADEDESK_USER_ID };
// }

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
    // console.log(user_id)
    let helper = require("../../controllers/v1/DashboardController");
    let data = await helper.getActivityData(user_id);
    return data;
}

// Get last price, 24 hour change, volume
var getHighInfo = async (pair) => {
    let helper = require("../tradding/get-socket-value");
    let data = await helper.getSocketValueData(pair);
    return data;
}

// CMS quantity and price precision
var getTradePrecision = async (pair) => {
    let helper = require("../get-pair-precision");
    let data = await helper.getPairPrecision(pair);
    return data;
}

module.exports = {
    getBuyBookData,
    getSellBookData,
    getBuyBookDataSummary,
    getSellBookDataSummary,
    getTradeHistoryData,
    getUserBalance,
    // getCardData,
    // getDepthChartData,
    // getInstrumentData,
    getUserOrdersData,
    getCancelledOrdersData,
    getPendingOrdersData,
    // getAllPendingOrders,
    getMarketValue,
    getUserFavouritesData,
    getPortfolioData,
    getActivityData,
    getHighInfo,
    getLatestValue,
    getTradePrecision
}
