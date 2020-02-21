var SellBookModel = require("../../models/SellBook");

var sellOrderBook = async (crypto, currency) => {
    var sellBookOrder = await SellBookModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .orderBy('price', 'ASC');

    return (sellBookOrder);
}

module.exports = {
    sellOrderBook
}