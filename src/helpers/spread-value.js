var PairsModel = require("../models/Pairs");

var spreadData = async (symbol) => {
    var spreadSql = `SELECT name, buy_value.bid_price, sell_value.ask_price
                                FROM pairs
                                LEFT JOIN (
                                    SELECT max(limit_price) as bid_price, symbol
                                        FROM buy_book
                                        WHERE deleted_at IS NULL AND symbol LIKE '%${symbol}%'
                                        GROUP BY symbol
                                ) as buy_value
                                ON pairs.name = buy_value.symbol
                                LEFT JOIN (
                                    SELECT min(limit_price) as ask_price, symbol
                                        FROM sell_book
                                        WHERE deleted_at IS NULL AND symbol LIKE '%${symbol}%'
                                        GROUP BY symbol
                                ) as sell_value
                                ON sell_value.symbol = pairs.name
                                WHERE deleted_at IS NULL AND name LIKE '%${symbol}%'`

    var spreadData = await PairsModel.knex().raw(spreadSql)
    spreadData = spreadData.rows;

    return (spreadData)
}

module.exports = {
    spreadData
}