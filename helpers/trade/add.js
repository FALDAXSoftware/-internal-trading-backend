var TradeHistoryModel = require("../../models/TradeHistory");

var addTradeHistory = async (orderData) => {
    let tradeHistory = await TradeHistoryModel
        .query()
        .insertAndFetch(orderData);

    return tradeHistory;
}

module.exports = {
    addTradeHistory
}