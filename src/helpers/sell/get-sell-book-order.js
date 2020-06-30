var SellBookModel = require("../../models/SellBook");
const {
    raw
} = require('objection');
var sellOrderBook = async (crypto, currency) => {
    var sellBookOrder = await SellBookModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('quantity', '>', 0 )
        .andWhere('limit_price', '>', 0 )
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .orderBy('price', 'ASC')
        .limit(1);

    // console.log("sellBookOrder", sellBookOrder)

    return (sellBookOrder);
}

module.exports = {
    sellOrderBook
}