var moment = require('moment');
var PendingBookModel = require("../../models/PendingBook");
var BuyBookModel = require("../../models/BuyBook");
var SellBookModel = require("../../models/SellBook");

var getPendingOrders = async (user_id, crypto, currency, month, limit = 100) => {
    var tradePendingDetails;

    if (month == 0) {
        // var pendingOrderDetails = await PendingBookModel
        //     .query()
        //     .select()
        //     .where('deleted_at', null)
        //     .andWhere('settle_currency', crypto)
        //     .andWhere('currency', currency)
        //     .andWhere('user_id', user_id)
        //     .orderBy('id', 'DESC')
        //     .limit(100);

        // var buyBookDetails = await BuyBookModel
        //     .query()
        //     .select()
        //     .where('deleted_at', null)
        //     .andWhere('settle_currency', crypto)
        //     .andWhere('currency', currency)
        //     .andWhere('user_id', user_id)
        //     .andWhere('is_partially_fulfilled', true)
        //     .orderBy('id', 'DESC')
        //     .limit(100);

        // var pendingDetailsBuy = pendingOrderDetails.concat(buyBookDetails);
        // var sellBookDetails = await SellBookModel
        //     .query()
        //     .select(
        //         'id',
        //         'fix_quantity',
        //         'quantity',
        //         'fill_price',
        //         'side',
        //         'order_type',
        //         'symbol',
        //         'created_at',
        //         'deleted_at',
        //         'limit_price',
        //         "placed_by")
        //     .where('deleted_at', null)
        //     .andWhere('settle_currency', crypto)
        //     .andWhere('currency', currency)
        //     .andWhere('user_id', user_id)
        //     .andWhere('is_partially_fulfilled', true)
        //     .orderBy('id', 'DESC')
        //     .limit(100);
        // tradePendingDetails = pendingDetailsBuy.concat(sellBookDetails);

        var pendingSql = `SELECT pending_orders.* FROM (
                                    SELECT id, CAST(user_id AS int) as user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM pending_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id='${user_id}'
                                    UNION ALL
                                    SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM buy_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true'
                                    UNION ALL
                                    SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM sell_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true'
                            ) as pending_orders ORDER BY created_at DESC LIMIT ${limit}`
        tradePendingDetails = await PendingBookModel.knex().raw(pendingSql);
        tradePendingDetails = tradePendingDetails.rows;
    } else {
        var yesterday = moment
            .utc()
            .subtract(month, 'months')
            .format();

        // var pendingOrderDetails = await PendingBookModel
        //     .query()
        //     .select()
        //     .where('deleted_at', null)
        //     .andWhere('settle_currency', crypto)
        //     .andWhere('currency', currency)
        //     .andWhere('user_id', user_id)
        //     .andWhere('created_at', '>=', yesterday)
        //     .orderBy('id', 'DESC')
        //     .limit(100);

        // var buyBookDetails = await BuyBookModel
        //     .query()
        //     .select(
        //         'id',
        //         'fix_quantity',
        //         'quantity',
        //         'fill_price',
        //         'side',
        //         'order_type',
        //         'symbol',
        //         'created_at',
        //         'deleted_at',
        //         'limit_price',
        //         "placed_by")
        //     .where('deleted_at', null)
        //     .andWhere('settle_currency', crypto)
        //     .andWhere('currency', currency)
        //     .andWhere('user_id', user_id)
        //     .andWhere('is_partially_fulfilled', true)
        //     .andWhere('created_at', '>=', yesterday)
        //     .orderBy('id', 'DESC')
        //     .limit(100);

        // console.log("buyBookDetails", buyBookDetails)
        // var pendingDetailsBuy = pendingOrderDetails.concat(buyBookDetails);

        // var sellBookDetails = await SellBookModel
        //     .query()
        //     .select(
        //         'id',
        //         'fix_quantity',
        //         'quantity',
        //         'fill_price',
        //         'side',
        //         'order_type',
        //         'symbol',
        //         'created_at',
        //         'deleted_at',
        //         'limit_price',
        //         "placed_by")
        //     .where('deleted_at', null)
        //     .andWhere('settle_currency', crypto)
        //     .andWhere('currency', currency)
        //     .andWhere('user_id', user_id)
        //     .andWhere('is_partially_fulfilled', true)
        //     .andWhere('created_at', '>=', yesterday)
        //     .orderBy('id', 'DESC')
        //     .limit(100);
        // tradePendingDetails = pendingDetailsBuy.concat(sellBookDetails);
        var pendingSql = `SELECT pending_orders.* FROM (
                                    SELECT id, CAST(user_id AS int) as user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM pending_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id='${user_id}' AND created_at >= '${yesterday}'
                                    UNION ALL
                                    SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM buy_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at >= '${yesterday}'
                                    UNION ALL
                                    SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM sell_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at >= '${yesterday}'
                            ) as pending_orders WHERE created_at >= '${yesterday}' ORDER BY created_at DESC LIMIT ${limit}`

        tradePendingDetails = await PendingBookModel.knex().raw(pendingSql);
        tradePendingDetails = tradePendingDetails.rows;
    }
    return tradePendingDetails;

},
var getUserPendingOrders = async (user_id, crypto, currency, limit = 100, page, fromDate, toDate) => {
    var tradePendingDetails;
    var yesterday = moment
        .utc()
        .subtract(month, 'months')
        .format();
    var pendingSql = `SELECT pending_orders.* FROM (
                                SELECT id, CAST(user_id AS int) as user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM pending_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id='${user_id}' AND created_at >= '${yesterday}'
                                UNION ALL
                                SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM buy_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at >= '${yesterday}'
                                UNION ALL
                                SELECT id, user_id,order_type, fill_price, limit_price, stop_price, quantity, currency, settle_currency, side, created_at, placed_by FROM sell_book WHERE deleted_at IS NULL AND settle_currency='${crypto}' AND currency='${currency}' AND user_id=${user_id} AND is_partially_fulfilled='true' AND created_at >= '${yesterday}'
                        ) as pending_orders WHERE created_at >= '${yesterday}' ORDER BY created_at DESC LIMIT ${page}, ${limit}`

    tradePendingDetails = await PendingBookModel.knex().raw(pendingSql);
    tradePendingDetails = tradePendingDetails.rows;

    return tradePendingDetails;

}

module.exports = {
    getPendingOrders,
    getUserPendingOrders
}