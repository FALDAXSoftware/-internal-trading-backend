var PriceHistoryModel = require("../../models/PriceHistory")

var latestPrice = async (coin, side) => {
    var get_price
    if (side == "Buy") {
        get_price = await PriceHistoryModel
            .query()
            // .first()
            .select()
            .where('coin', coin)
            .andWhere('type', 1)
            .andWhere("ask_price", '>', 0)
            .orderBy('id', 'DESC');
    } else if (side == "Sell") {
        get_price = await PriceHistoryModel
            .query()
            // .first()
            .select()
            .where('coin', coin)
            .andWhere('type', 0)
            .andWhere("bid_price", '>', 0)
            .orderBy('id', 'DESC');
    }

    return get_price
}

module.exports = {
    latestPrice
}