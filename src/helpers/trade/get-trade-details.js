var TradeHistoryModel = require("../../models/TradeHistory");

var getTradeDetails = async (crypto, currency, limit=100) => {
    var tradeDetails = await TradeHistoryModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .orderBy('id', 'DESC')
        .limit(limit);

    return tradeDetails;
}

module.exports = {
    getTradeDetails
}