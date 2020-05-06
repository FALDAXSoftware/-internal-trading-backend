var BuyBookModel = require("../../models/BuyBook");
const {
    raw
} = require('objection');
var getBuyBookOrder = async (crypto, currency) => {

    var buyBookOrders = await BuyBookModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .orderBy('price', 'DESC')
        .limit(1);

    return (buyBookOrders)
}

module.exports = {
    getBuyBookOrder
}