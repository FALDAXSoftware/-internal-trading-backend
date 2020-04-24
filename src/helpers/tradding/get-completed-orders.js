/*
Get Completed Orders of Users
*/
var moment = require('moment');
var TradeHistoryModel = require("../../models/TradeHistory");

var getCompletedOrders = async (user_id, crypto, currency, month) => {
    // Get completed data.
    var completedData;
    var yesterday = moment
        .utc()
        .subtract(month, 'months')
        .format();

    var tradeData = await TradeHistoryModel
        .query()
        .select(
            'id',
            'fix_quantity',
            'quantity',
            'fill_price',
            'side',
            'order_type',
            'symbol',
            'created_at',
            'deleted_at',
            'limit_price',
            'settle_currency',
            'currency',
            'user_id',
            "requested_user_id",
            "placed_by"
        )
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('created_at', '>=', yesterday)
        .andWhere(builder => {
            builder.where('user_id', user_id)
                .orWhere('requested_user_id', user_id)
        })
        .orderBy('id', 'DESC');
    return tradeData;
}

module.exports = {
    getCompletedOrders
}