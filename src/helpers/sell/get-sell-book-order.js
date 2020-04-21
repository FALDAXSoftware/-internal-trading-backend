var SellBookModel = require("../../models/SellBook");
const {
    raw
} = require('objection');
var sellOrderBook = async (crypto, currency) => {
    var sellBookOrder = await SellBookModel
        .query()
        .select('price', raw('SUM(quantity) as quantity'))
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .groupBy('price')
        .orderBy('price', 'ASC').limit(100);

    // console.log("sellBookOrder", sellBookOrder)

    return (sellBookOrder);
}

module.exports = {
    sellOrderBook
}