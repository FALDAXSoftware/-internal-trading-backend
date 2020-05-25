var PriceHistoryModel = require("../../models/PriceHistory")

var latestPrice = async (coin, side) => {
    try {
        console.log("coin", coin);
        console.log("side", side);
        var get_price
        if (side == "Buy") {
            console.log(coin);

            get_price = await PriceHistoryModel
                .query()
                // .first()
                .select()
                .where('coin', coin)
                .andWhere('type', 1)
                .andWhere("ask_price", '>', 0)
                .orderBy('id', 'DESC');
            console.log("get_price", JSON.stringify(get_price));
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
    } catch (err) {
        console.log("err", err);
        return err;
    }

}

module.exports = {
    latestPrice
}
