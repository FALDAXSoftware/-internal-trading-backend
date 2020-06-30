var SellBookModel = require("../../models/SellBook");
const {
    raw
} = require('objection');
var SellBookOrderData = async (crypto, currency, limit_price) => {
    var sellBookOrder = await SellBookModel
        .query()
        .select('price', raw('SUM(quantity) as quantity'))
        .where('deleted_at', null)
        .andWhere('quantity', '>', 0 )
        .andWhere('limit_price', '>', 0 )
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('limit_price', limit_price )
        .groupBy('price')
        .orderBy('price', 'ASC')

    return (sellBookOrder);
}

module.exports = {
    SellBookOrderData
}