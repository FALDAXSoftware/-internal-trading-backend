var moment = require('moment');
var PendingBookModel = require("../../models/PendingBook");
var BuyBookModel = require("../../models/BuyBook");
var SellBookModel = require("../../models/SellBook");

var getAllPendingOrders = async (crypto, currency) => {
    var tradePendingDetails;
    var pendingOrderDetails = await PendingBookModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .orderBy('id', 'DESC');

    var buyBookDetails = await BuyBookModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('is_partially_fulfilled', true)
        .orderBy('id', 'DESC');

    var pendingDetailsBuy = pendingOrderDetails.concat(buyBookDetails);
    var sellBookDetails = await SellBookModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('is_partially_fulfilled', true)
        .orderBy('id', 'DESC');
    tradePendingDetails = pendingDetailsBuy.concat(sellBookDetails);

    return tradePendingDetails;

}

module.exports = {
    getAllPendingOrders
}