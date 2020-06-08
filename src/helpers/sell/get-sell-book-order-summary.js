var SellBookModel = require("../../models/SellBook");
const {
    raw
} = require('objection');
var sellOrderBookSummary = async (crypto, currency) => {
    var sellBookOrder = await SellBookModel
        .query()
        .select('price')
        .sum('quantity as quantity')
        .where('deleted_at', null)
        .andWhere('quantity', '>', 0)
        .andWhere('limit_price', '>', 0)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .groupBy('price')
        .orderBy('price', 'ASC')
        .limit(100);

    // var totalSql = await SellBookModel
    //     .query()
    //     // .select(raw('SUM(quantity) as total'), 'id')
    //     .sum('quantity as total')
    //     // .sum({ total: raw('(quantity * price)') })
    //     .where('deleted_at', null)
    //     .andWhere('quantity', '>', 0)
    //     .andWhere('limit_price', '>', 0)
    //     .andWhere('settle_currency', crypto)
    //     .andWhere('currency', currency)
    //     .limit(100)

    console.log("sellBookOrder", sellBookOrder)

    var totalQuantity = 0.0;
    for (let index = 0; index < sellBookOrder.length; index++) {
        const element = sellBookOrder[index];
        console.log("element", element);
        console.log("element.quantity", element.quantity)
        totalQuantity = parseFloat(totalQuantity) + parseFloat(element.quantity);
        console.log("totalQuantity", totalQuantity)
    }

    // var totalSql = `SELECT SUM(quantity) as total
    //                     FROM sell_book WHERE settle_currency='${crypto}' AND currency='${currency}'
    //                     AND deleted_at IS NULL AND quantity > 0 AND limit_price > 0 
    //                     LIMIT 100`

    // var totalData = await SellBookModel.knex().raw(totalSql)
    // console.log("totalData", totalData)

    var sellTotal = {
        "data": sellBookOrder,
        "total": totalQuantity
    }


    return (sellTotal);
}

module.exports = {
    sellOrderBookSummary
}