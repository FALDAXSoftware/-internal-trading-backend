var BuyBookModel = require("../../models/BuyBook");
const {
    raw
} = require('objection');
var getBuyBookOrder = async (crypto, currency, user_id = null) => {

    var buyBookOrders;
    if (user_id == null) {
        buyBookOrders = await BuyBookModel
            .query()
            .select()
            .where('deleted_at', null)
            .andWhere('quantity', '>', 0)
            .andWhere('limit_price', '>', 0)
            .andWhere('settle_currency', crypto)
            .andWhere('currency', currency)
            .orderBy('price', 'DESC')
            .limit(1);
    } else {
        buyBookOrders = await BuyBookModel
            .query()
            .select()
            .where('deleted_at', null)
            .andWhere('quantity', '>', 0)
            .andWhere('limit_price', '>', 0)
            .andWhere('settle_currency', crypto)
            .andWhere('currency', currency)
            .andWhere('user_id', '!=', user_id)
            .orderBy('price', 'DESC')
            .limit(1);
    }

    return (buyBookOrders)
}

module.exports = {
    getBuyBookOrder
}