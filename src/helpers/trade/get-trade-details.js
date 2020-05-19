var TradeHistoryModel = require("../../models/TradeHistory");
var moment = require('moment');

var getTradeDetails = async (crypto, currency, limit = 500) => {
    var now = moment().utc().subtract(1, 'days').format("YYYY-MM-DD HH:mm:ss");
    var tradeDetails = await TradeHistoryModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere("created_at", "<=", now)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .orderBy('id', 'DESC')
        .limit(limit);

    return tradeDetails;
}

module.exports = {
    getTradeDetails
}