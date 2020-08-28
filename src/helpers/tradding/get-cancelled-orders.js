var moment = require('moment');
var ActivityModel = require("../../models/Activity");
var PendingOrdersExecutionModel = require("../../models/PendingOrdersExecutuions");
const {
    raw
} = require('objection');

const redis = require("redis");
const axios = require("axios");
const port_redis = 6379;

const redis_client = redis.createClient({
    port: process.env.REDIS_PORT,               // replace with your port
    host: process.env.REDIS_HOST,        // replace with your hostanme or IP address
    password: process.env.REDIS_PASSWORD   // replace with your password
});

var getCancelledOrders = async (user_id, crypto, currency, month, limit = 200) => {
    var cancelDetails;

    var yesterday = moment.utc().subtract(month, 'months').format();

    // cancelDetails = await ActivityModel
    //     .query()
    //     .select('id',
    //         'fix_quantity',
    //         'quantity',
    //         'fill_price',
    //         'side',
    //         'order_type',
    //         'symbol',
    //         'created_at',
    //         'deleted_at',
    //         'limit_price',
    //         "placed_by",
    //         "reason")
    //     .where('deleted_at', null)
    //     .andWhere('is_cancel', true)
    //     .andWhere('settle_currency', crypto)
    //     .andWhere('currency', currency)
    //     .andWhere('created_at', ">=", yesterday)
    //     .andWhere('user_id', user_id)
    //     .orderBy('id', 'DESC')
    //     .limit(limit);
    // console.log("cancelDetails", cancelDetails)

    // var pendingCancelDetails = await PendingOrdersExecutionModel
    //     .query()
    //     .select('id',
    //         'quantity',
    //         'side',
    //         'order_type',
    //         'symbol',
    //         'created_at',
    //         'deleted_at',
    //         'limit_price',
    //         "placed_by",
    //         "reason")
    //     .where(builder => {
    //         builder.whereNotNull('reason')
    //             .orWhere('is_cancel', true)
    //     })
    //     .andWhere('deleted_at', null)
    //     // .andWhere('is_cancel', true)
    //     .andWhere('settle_currency', crypto)
    //     .andWhere('currency', currency)
    //     .andWhere('created_at', ">=", yesterday)
    //     .andWhere("user_id", user_id)
    //     .orderBy('id', 'DESC')
    //     .limit(limit);

    // console.log("pendingCancelDetails", pendingCancelDetails)

    // if (cancelDetails != undefined) {
    //     cancelDetails = cancelDetails.concat(pendingCancelDetails);
    // } else {
    //     cancelDetails = pendingCancelDetails
    // }

    var cancelledOrders = await ActivityModel.knex().raw(`SELECT activity_table.id, activity_table.fix_quantity, activity_table.quantity, activity_table.fill_price, 
                                                                activity_table.side, activity_table.order_type, activity_table.symbol, 
                                                                activity_table.created_at, activity_table.deleted_at, activity_table.limit_price,
                                                                activity_table.placed_by, activity_table.reason, pending_orders_execution.id, pending_orders_execution.quantity,
                                                                pending_orders_execution.side, pending_orders_execution.order_type, 
                                                                pending_orders_execution.side, pending_orders_execution.order_type, 
                                                                pending_orders_execution.symbol, pending_orders_execution.created_at, 
                                                                pending_orders_execution.deleted_at, pending_orders_execution.limit_price, 
                                                                pending_orders_execution.placed_by, pending_orders_execution.reason
                                                                FROM activity_table 
                                                                LEFT JOIN pending_orders_execution
                                                                ON activity_table.currency = pending_orders_execution.currency
                                                                WHERE (activity_table.is_cancel = true OR pending_orders_execution.is_cancel = true) 
                                                                AND activity_table.deleted_at IS NULL 
                                                                AND activity_table.user_id = '${user_id}' AND activity_table.settle_currency = '${crypto}' 
                                                                AND activity_table.currency = '${currency}' AND pending_orders_execution.deleted_at IS NULL
                                                                AND pending_orders_execution.user_id = ${user_id} AND pending_orders_execution.settle_currency = '${crypto}' 
                                                                AND pending_orders_execution.currency = '${currency}'
                                                                ORDER BY pending_orders_execution.created_at DESC, activity_table.id DESC
                                                                LIMIT ${limit}`)


    // redis_client.setex(`${user_id}-${crypto}-${currency}-${month}-cancelled-orders`, 3000, JSON.stringify(cancelDetails));
    return (cancelledOrders.rows);

}

var getUserCancelledOrders = async (user_id, crypto, currency, limit = 2000, page, fromDate, toDate) => {

    var cancelDetails;
    cancelDetails = await ActivityModel
        .query()
        .select('id',
            'fix_quantity',
            'quantity',
            'fill_price',
            'side',
            'order_type',
            'symbol',
            'created_at',
            'deleted_at',
            'limit_price',
            "placed_by")
        .where('deleted_at', null)
        .andWhere('is_cancel', true)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere(builder => {
            builder.where('user_id', user_id)
                .orWhere('requested_user_id', user_id)
        })
        .andWhere(builder => {
            if (fromDate != '' && toDate != '') {
                builder.where('created_at', '>=', fromDate)
                    .andWhere('created_at', '<=', toDate)
            }
        })
        .page(parseInt(page - 1), limit)
        .orderBy('id', 'DESC')
        .limit(limit);
    cancelDetails.nextPage = parseInt(page - 1) + 1;
    return (cancelDetails);

}

module.exports = {
    getCancelledOrders,
    getUserCancelledOrders
}