var TradeHistoryModel = require("../../models/TradeHistory");

var addTradeHistory = async (orderData) => {
    try {
        orderData.is_partially_filled = orderData.is_partially_fulfilled;
        delete orderData.is_partially_fulfilled;
        let tradeHistory = await TradeHistoryModel
            .query()
            .insertAndFetch({ ...orderData });

        return tradeHistory;
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    addTradeHistory
}