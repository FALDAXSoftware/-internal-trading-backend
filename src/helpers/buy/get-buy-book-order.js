var BuyBookModel = require("../../models/BuyBook");
const {
    raw
} = require('objection');
var getBuyBookOrder = async (crypto, currency) => {

    var buyBookOrders = await BuyBookModel
        .query()
        .select('price', raw('SUM(quantity) as quantity'))
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .groupBy('price')
        .orderBy('price', 'DESC').limit(100);

    return (buyBookOrders)
}

module.exports = {
    getBuyBookOrder
}