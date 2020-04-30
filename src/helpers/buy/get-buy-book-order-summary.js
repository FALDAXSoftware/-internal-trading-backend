var BuyBookModel = require("../../models/BuyBook");
const {
    raw
} = require('objection');
var getBuyBookOrderSummary = async (crypto, currency) => {

    var buyBookOrders = await BuyBookModel
        .query()
        .select('price', raw('SUM(quantity) as quantity'))
        .where('deleted_at', null)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .groupBy('price')
        .orderBy('price', 'DESC')
        .limit(100);

    var totalSql = `SELECT SUM(price * quantity) as total 
                        FROM buy_book WHERE settle_currency='${crypto}' AND currency='${currency}' 
                        AND deleted_at IS NULL`

    var totalData = await BuyBookModel.knex().raw(totalSql)

    var buyTotal = {
        "data": buyBookOrders,
        "total": totalData
    }

    return (buyTotal)
}

module.exports = {
    getBuyBookOrderSummary
}