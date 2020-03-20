var moment = require('moment');
var ActivityModel = require("../../models/Activity");
const {
    raw
} = require('objection');


var getCancelledOrders = async (user_id, crypto, currency, month) => {

    var cancelDetails;

    var yesterday = moment.utc().subtract(month, 'months').format();

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
            'limit_price')
        .where('deleted_at', null)
        .andWhere('is_cancel', true)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('created_at', ">=", yesterday)
        .andWhere(builder => {
            builder.where('user_id', user_id)
                .orWhere('requested_user_id', user_id)
        })
        .orderBy('id', 'DESC');

    return (cancelDetails);

}

module.exports = {
    getCancelledOrders
}