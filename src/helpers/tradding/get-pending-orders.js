var moment = require('moment');
var PendingBookModel = require("../../models/PendingBook");
var BuyBookModel = require("../../models/BuyBook");
var SellBookModel = require("../../models/SellBook");

var getPendingOrders = async (user_id, crypto, currency, month) => {
    var tradePendingDetails;

    if (month == 0) {
        var pendingOrderDetails = await PendingBookModel
            .query()
            .select()
            .where('deleted_at', null)
            .andWhere('settle_currency', crypto)
            .andWhere('currency', currency)
            .andWhere('user_id', user_id)
            .orderBy('id', 'DESC');

        var buyBookDetails = await BuyBookModel
            .query()
            .select()
            .where('deleted_at', null)
            .andWhere('settle_currency', crypto)
            .andWhere('currency', currency)
            .andWhere('user_id', user_id)
            .andWhere('is_partially_fulfilled', true)
            .orderBy('id', 'DESC');

        var pendingDetailsBuy = pendingOrderDetails.concat(buyBookDetails);
        var sellBookDetails = await SellBookModel
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
                'limit_price')
            .where('deleted_at', null)
            .andWhere('settle_currency', crypto)
            .andWhere('currency', currency)
            .andWhere('user_id', user_id)
            .andWhere('is_partially_fulfilled', true)
            .orderBy('id', 'DESC');
        tradePendingDetails = pendingDetailsBuy.concat(sellBookDetails);
    } else {
        var yesterday = moment
            .utc()
            .subtract(month, 'months')
            .format();

        var pendingOrderDetails = await PendingBookModel
            .query()
            .select()
            .where('deleted_at', null)
            .andWhere('settle_currency', crypto)
            .andWhere('currency', currency)
            .andWhere('user_id', user_id)
            .andWhere('created_at', '>=', yesterday)
            .orderBy('id', 'DESC');

        var buyBookDetails = await BuyBookModel
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
                'limit_price')
            .where('deleted_at', null)
            .andWhere('settle_currency', crypto)
            .andWhere('currency', currency)
            .andWhere('user_id', user_id)
            .andWhere('is_partially_fulfilled', true)
            .andWhere('created_at', '>=', yesterday)
            .orderBy('id', 'DESC');

        console.log("buyBookDetails", buyBookDetails)
        var pendingDetailsBuy = pendingOrderDetails.concat(buyBookDetails);

        var sellBookDetails = await SellBookModel
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
                'limit_price')
            .where('deleted_at', null)
            .andWhere('settle_currency', crypto)
            .andWhere('currency', currency)
            .andWhere('user_id', user_id)
            .andWhere('is_partially_fulfilled', true)
            .andWhere('created_at', '>=', yesterday)
            .orderBy('id', 'DESC');
        tradePendingDetails = pendingDetailsBuy.concat(sellBookDetails);
    }
    return tradePendingDetails;

}

module.exports = {
    getPendingOrders
}