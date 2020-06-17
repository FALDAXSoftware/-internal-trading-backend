var moment = require('moment');
var PendingBookModel = require("../../models/PendingBook");
var PendngOrderExecutionModels = require("../../models/PendingOrdersExecutuions");
var BuyBookModel = require("../../models/BuyBook");
var SellBookModel = require("../../models/SellBook");

var getPendingOrders = async (user_id, crypto, currency, month, limit = 2000) => {
    var tradePendingDetails;

    if (month == 0) {
        var pendingSql = `SELECT pending_orders.* FROM (
                                    SELECT id,is_stop_limit, CAST(user_id AS int) as user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM pending_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id='${user_id}'
                                    UNION ALL
                                    SELECT id, is_stop_limit, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM buy_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true'
                                    UNION ALL
                                    SELECT id, is_stop_limit ,user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM sell_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true'
                            ) as pending_orders ORDER BY created_at DESC LIMIT ${limit}`
        // console.log("pendingSql", pendingSql)
        tradePendingDetails = await PendingBookModel.knex().raw(pendingSql);
        tradePendingDetails = tradePendingDetails.rows;

        var getPendingDetails = await PendngOrderExecutionModels
            .query()
            .select("id", "user_id", "order_type", "limit_price", "quantity", "currency", "settle_currency", "side", "placed_by", "is_cancel", "is_under_execution")
            .where("deleted_at", null)
            .andWhere("is_executed", false)
            .andWhere("user_id", user_id)
            .andWhere("settle_currency", crypto)
            .andWhere("currency", currency)
            .orderBy("id", "DESC")
            .limit(limit);

        for (var i = 0; i < getPendingDetails.length; i++) {
            getPendingDetails[i].flag = true;
        }

        if (tradePendingDetails != undefined) {
            tradePendingDetails = tradePendingDetails.concat(getPendingDetails);
        } else {
            tradePendingDetails = getPendingDetails;
        }

        // console.log()
    } else {
        var yesterday = moment
            .utc()
            .subtract(month, 'months')
            .format();
        var pendingSql = `SELECT pending_orders.* FROM (
                                    SELECT id,is_stop_limit, CAST(user_id AS int) as user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM pending_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id='${user_id}' AND created_at >= '${yesterday}'
                                    UNION ALL
                                    SELECT id, is_stop_limit,user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM buy_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at >= '${yesterday}'
                                    UNION ALL
                                    SELECT id, is_stop_limit,user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM sell_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at >= '${yesterday}'
                            ) as pending_orders WHERE created_at >= '${yesterday}' ORDER BY created_at DESC LIMIT ${limit}`
        // console.log("pendingSql", pendingSql)
        tradePendingDetails = await PendingBookModel.knex().raw(pendingSql);
        tradePendingDetails = tradePendingDetails.rows;
        // console.log("tradePendingDetails", tradePendingDetails)
        var getPendingDetails = await PendngOrderExecutionModels
            .query()
            .select("id", "user_id", "order_type", "limit_price", "quantity", "currency", "settle_currency", "side", "placed_by", "is_cancel", "is_under_execution")
            .where("deleted_at", null)
            .andWhere("is_cancel", false)
            .andWhere("is_executed", false)
            .andWhere("user_id", user_id)
            .andWhere("settle_currency", crypto)
            .andWhere("currency", currency)
            .andWhere("created_at", ">=", yesterday)
            .orderBy("id", "DESC")
            .limit(limit);

        for (var i = 0; i < getPendingDetails.length; i++) {
            getPendingDetails[i].flag = true;
        }

        if (tradePendingDetails != undefined) {
            tradePendingDetails = tradePendingDetails.concat(getPendingDetails);
        } else {
            tradePendingDetails = getPendingDetails;
        }
    }
    // console.log("tradePendingDetails", tradePendingDetails)
    return tradePendingDetails;

}

var getUserPendingOrders = async (user_id, crypto, currency, limit = 2000, page, fromDate, toDate) => {
    var tradePendingDetails;
    // var yesterday = moment
    //     .utc()
    //     .subtract(month, 'months')
    //     .format();
    // console.log(fromDate, toDate)
    if (fromDate != undefined && toDate != undefined) {
        // console.log(1)
        var pendingSql = `SELECT pending_orders.* FROM (
                                    SELECT id, CAST(user_id AS int) as user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM pending_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id='${user_id}' 
                                    UNION ALL
                                    SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM buy_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at >= '${fromDate}' AND created_at <= '${toDate}'
                                    UNION ALL
                                    SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM sell_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at >= '${fromDate}' AND created_at <= '${toDate}'
                            ) as pending_orders WHERE created_at >= '${fromDate}' AND created_at <= '${toDate}' ORDER BY created_at DESC LIMIT ${limit} OFFSET ((${limit})*${page - 1})`
    } else if (fromDate != undefined && toDate == undefined) {
        // console.log(2)
        var pendingSql = `SELECT pending_orders.* FROM (
            SELECT id, CAST(user_id AS int) as user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM pending_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id='${user_id}' AND created_at >= '${fromDate}'
            UNION ALL
            SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM buy_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at >= '${fromDate}'
            UNION ALL
            SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM sell_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at >= '${fromDate}'
    ) as pending_orders WHERE created_at >= '${fromDate}' ORDER BY created_at DESC LIMIT ${limit} OFFSET ((${limit})*${page - 1})`
    } else if (fromDate == undefined && toDate != undefined) {
        // console.log(3)
        var pendingSql = `SELECT pending_orders.* FROM (
                    SELECT id, CAST(user_id AS int) as user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM pending_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id='${user_id}' AND created_at <= '${toDate}'
                    UNION ALL
                    SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM buy_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at <= '${toDate}'
                    UNION ALL
                    SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM sell_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at <= '${toDate}'
            ) as pending_orders WHERE AND created_at <= '${toDate}' ORDER BY created_at DESC LIMIT ${limit} OFFSET ((${limit})*${page - 1})`

    } else if (fromDate == undefined && toDate == undefined) {
        // console.log(4)
        var pendingSql = `SELECT pending_orders.* FROM (
            SELECT id, CAST(user_id AS int) as user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM pending_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id='${user_id}' 
            UNION ALL
            SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM buy_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' 
            UNION ALL
            SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM sell_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' 
    ) as pending_orders ORDER BY created_at DESC LIMIT ${limit} OFFSET ((${limit})*${page - 1})`
    }
    // console.log(pendingSql)
    tradePendingDetails = await PendingBookModel.knex().raw(pendingSql);
    tradePendingDetails = tradePendingDetails.rows;

    return tradePendingDetails;

}

module.exports = {
    getPendingOrders,
    getUserPendingOrders
}