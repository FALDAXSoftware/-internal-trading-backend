/*
Get Completed Orders of Users
*/
var moment = require('moment');
var TradeHistoryModel = require("../../models/TradeHistory");

var getCompletedOrders = async (user_id, crypto, currency, month, limit = 100) => {
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
            "placed_by",
            "is_stop_limit"
        )
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('created_at', '>=', yesterday)
        .andWhere(builder => {
            builder.where('user_id', user_id)
                .orWhere('requested_user_id', user_id)
        })
        .orderBy('id', 'DESC')
        .limit(limit);
    return tradeData;
}

var getUserCompletedOrders = async (user_id, crypto, currency, limit = 100, page, fromDate = '', toDate = '') => {
    console.log("fromDate", fromDate);
    console.log("toDate", toDate);
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
        // .andWhere('created_at', '>=', yesterday)
        .andWhere(builder => {
            if (fromDate != '' && toDate != '') {
                builder.where('created_at', '>=', fromDate)
                    .andWhere('created_at', '<=', toDate)
            }
        })
        .andWhere(builder => {
            builder.where('user_id', user_id)
                .orWhere('requested_user_id', user_id)
        })
        .page(parseInt(page - 1), limit)
        .orderBy('id', 'DESC');
    tradeData.nextPage = parseInt(page - 1) + 1;
    // .limit(limit);
    return tradeData;
}

module.exports = {
    getCompletedOrders,
    getUserCompletedOrders
}