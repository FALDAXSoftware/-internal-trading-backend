var SellBookModel = require("../../models/SellBook");
const {
    raw
} = require('objection');
var sellOrderBookSummary = async (crypto, currency) => {
    var sellBookOrder = await SellBookModel
        .query()
        .select('price', raw('SUM(quantity) as quantity'))
        .where('deleted_at', null)
        .andWhere('quantity', '>', 0)
        .andWhere('limit_price', '>', 0)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .groupBy('price')
        .orderBy('price', 'ASC').limit(100);

    var totalSql = `SELECT SUM(quantity) as total
                        FROM sell_book WHERE settle_currency='${crypto}' AND currency='${currency}'
                        AND deleted_at IS NULL AND quantity > 0 AND limit_price > 0 
                        LIMIT 100`

    var totalData = await SellBookModel.knex().raw(totalSql)

    var sellTotal = {
        "data": sellBookOrder,
        "total": totalData.rows[0].total
    }


    return (sellTotal);
}

module.exports = {
    sellOrderBookSummary
}