var BuyBookModel = require("../../models/BuyBook");
const {
    raw
} = require('objection');
var BuyBookOrderData = async (crypto, currency, limit_price) => {
    var buyBookOrders = await BuyBookModel
        .query()
        .select('price', raw('SUM(quantity) as quantity'))
        .where('deleted_at', null)
        .andWhere('quantity', '>', 0)
        .andWhere('limit_price', '>', 0)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('limit_price', limit_price)
        .groupBy('price')
        .orderBy('price', 'DESC');
    return (buyBookOrders)
}

module.exports = {
    BuyBookOrderData
}