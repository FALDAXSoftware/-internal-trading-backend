var TradeHistoryModel = require("../../models/TradeHistory");
var moment = require('moment');

// Redis
const redis = require("redis");
const axios = require("axios");
const port_redis = 6379;

const redis_client = redis.createClient(port_redis);

var getTradeDetails = async (crypto, currency, limit = 500) => {
    var now = moment().utc().subtract(1, 'days').format("YYYY-MM-DD HH:mm:ss");
    var tradeDetails = await TradeHistoryModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('quantity', '>', 0)
        .andWhere('fill_price', '>', 0)
        // .andWhere("created_at", ">=", now)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .orderBy('id', 'DESC')
        .limit(limit);

    console.log("BEFOR RETURN ING", tradeDetails)

    redis_client.setex(`trade-data-${crypto}-${currency}`, 10, JSON.stringify(tradeDetails));
    console.log("RETURNING DATA")
    return tradeDetails;
}

module.exports = {
    getTradeDetails
}