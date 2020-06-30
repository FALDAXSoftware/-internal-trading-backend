var BuyBookModel = require("../../models/BuyBook");
const {
    raw
} = require('objection');
var getBuyBookOrderSummary = async (crypto, currency) => {

    var buyBookOrders = await BuyBookModel
        .query()
        .select('price')
        .sum('quantity as quantity')
        .where('deleted_at', null)
        .andWhere('quantity', '>', 0)
        .andWhere('limit_price', '>', 0)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .groupBy('price')
        .orderBy('price', 'DESC')
        .limit(100);

    // console.log("BUY BOK", buyBookOrders)

    // var buyBookOrdersObjection = await BuyBookModel
    //     .query()
    //     .select('price')
    //     .sum('quantity as quantity')
    //     .where('deleted_at', null)
    //     .andWhere('quantity', '>', 0)
    //     .andWhere('limit_price', '>', 0)
    //     .andWhere('settle_currency', crypto)
    //     .andWhere('currency', currency)
    //     .groupBy('price')
    //     .orderBy('price', 'DESC')
    //     .limit(100);

    // console.log("BUY BOK FUNCTION", buyBookOrdersObjection)

    // var totalSql = await BuyBookModel
    //     .query()
    //     // .select(raw('SUM(quantity) as total_value_1'), raw('SUM(quantity * price) as total_1'))
    //     .sum('quantity as total_value')
    //     .sum({ total: raw('(quantity * price)') })
    //     .where('deleted_at', null)
    //     .andWhere('quantity', '>', 0)
    //     .andWhere('limit_price', '>', 0)
    //     .andWhere('settle_currency', crypto)
    //     .andWhere('currency', currency)
    //     .limit(100);

    // console.log("totalSql", totalSql)

    var totalQuantity = 0.0;
    var totalQuantityFill = 0.0;
    for (let index = 0; index < buyBookOrders.length; index++) {
        const element = buyBookOrders[index];
        totalQuantity = parseFloat(totalQuantity) + parseFloat(element.quantity);
        totalQuantityFill = parseFloat(totalQuantityFill) + parseFloat(element.quantity * element.price)
    }

    // var totalSql = `SELECT SUM(price * quantity) as total
    //                     FROM buy_book WHERE settle_currency='${crypto}' AND currency='${currency}'
    //                     AND deleted_at IS NULL AND quantity > 0 AND limit_price > 0
    //                     LIMIT 100`

    // var totalData = await BuyBookModel.knex().raw(totalSql);
    // console.log("totalData", totalData)

    // var totalQuantitySql = `SELECT SUM(quantity) as total_value
    //                             FROM buy_book WHERE settle_currency='${crypto}' AND currency='${currency}'
    //                             AND deleted_at IS NULL AND quantity > 0 AND limit_price > 0
    //                             LIMIT 100`
    // var totalQuanityData = await BuyBookModel.knex().raw(totalQuantitySql);
    // console.log("totalQuantitySql", totalQuantitySql)

    var buyTotal = {
        "data": buyBookOrders,
        "total": totalQuantityFill,
        "total_quantity": totalQuantity
    }

    return (buyTotal)
}

module.exports = {
    getBuyBookOrderSummary
}