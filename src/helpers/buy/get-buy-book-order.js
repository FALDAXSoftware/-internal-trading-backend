var BuyBookModel = require("../../models/BuyBook");
const {
    raw
} = require('objection');
var getBuyBookOrder = async (crypto, currency) => {

    var buyBookOrders = await BuyBookModel
        .query()
        .select()
        .where('deleted_at', null)
        .andWhere('quantity', '>', 0)
        .andWhere('limit_price', '>', 0)
        .andWhere('settle_currency', crypto)
        .andWhere('currency', currency)
        .orderBy('price', 'DESC')
        .orderBy('created_at', 'ASC')
        .limit(1);
    // var buyBookOrders = await BuyBookModel.knex().raw(`SELECT * FROM buy_book
    //                                                     WHERE deleted_at IS NULL AND quantity > 0 AND limit_price > 0
    //                                                     AND settle_currency = '${crypto}' AND currency = '${currency}'
    //                                                     ORDER BY price DESC
    //                                                     LIMIT 1
    //                                                     FOR UPDATE`)
    // buyBookOrders = buyBookOrders.rows;
    // console.log("buyBookOrders", buyBookOrders)
    return (buyBookOrders)
}

module.exports = {
    getBuyBookOrder
}