var BuyBookModel = require("../../models/BuyBook");
const {
    raw
} = require('objection');
var getBuyBookOrderSummary = async (crypto, currency) => {

    var buyBookOrders = await BuyBookModel
        .query()
        .select('price', raw('SUM(quantity) as quantity'))
        .where('deleted_at', null)
        .andWhere('quantity', '>', 0)
        .andWhere('limit_price', '>', 0)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .groupBy('price')
        .orderBy('price', 'DESC')
        .limit(100);

    var totalSql = `SELECT SUM(price * quantity) as total
                        FROM buy_book WHERE settle_currency='${crypto}' AND currency='${currency}'
                        AND deleted_at IS NULL AND quantity > 0 AND limit_price > 0
                        LIMIT 100`

    var totalData = await BuyBookModel.knex().raw(totalSql);

    var totalQuantitySql = `SELECT SUM(quantity) as total_value
                                FROM buy_book WHERE settle_currency='${crypto}' AND currency='${currency}'
                                AND deleted_at IS NULL AND quantity > 0 AND limit_price > 0
                                LIMIT 100`
    var totalQuanityData = await BuyBookModel.knex().raw(totalQuantitySql);

    var buyTotal = {
        "data": buyBookOrders,
        "total": totalData.rows[0].total,
        "total_quantity": totalQuanityData.rows[0].total_value
    }

    return (buyTotal)
}

module.exports = {
    getBuyBookOrderSummary
}