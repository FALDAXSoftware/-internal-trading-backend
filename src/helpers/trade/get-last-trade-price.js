var TradeHistoryModel = require("../../models/TradeHistory");

var getLastPrice = async (crypto, currency) => {
    // var lastTradePrice = 0.0;
    // console.log("crypto, currency", crypto, currency)
    var lastTradePrice = await TradeHistoryModel
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .orderBy('id', 'DESC');
    // console.log("lastTradePrice", lastTradePrice)
    return (lastTradePrice);
}

module.exports = {
    getLastPrice
}