var SellBookModel = require("../../models/SellBook");
const {
    raw
} = require('objection');
var sellOrderBook = async (crypto, currency, user_id = null) => {
    if (user_id == null) {
        var sellBookOrder = await SellBookModel
            .query()
            .select()
            .where('deleted_at', null)
            .andWhere('quantity', '>', 0)
            .andWhere('limit_price', '>', 0)
            .andWhere('settle_currency', crypto)
            .andWhere('currency', currency)
            .orderBy('price', 'ASC')
            .limit(1);
    } else {
        var sellBookOrder = await SellBookModel
            .query()
            .select()
            .where('deleted_at', null)
            .andWhere('quantity', '>', 0)
            .andWhere('limit_price', '>', 0)
            .andWhere('settle_currency', crypto)
            .andWhere('currency', currency)
            .andWhere('user_id', "!=", user_id)
            // .andWhere("placed_by", "=", process.env.TRADEDESK_BOT)
            .orderBy('price', 'ASC')
            .limit(1);
    }

    // console.log("sellBookOrder", sellBookOrder)

    return (sellBookOrder);
}

module.exports = {
    sellOrderBook
}