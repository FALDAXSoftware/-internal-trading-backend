var SellBookModel = require("../../models/SellBook");
const {
    raw
} = require('objection');

var logger = require("../../controllers/v1/logger");

// Redis
const redis = require("redis");
const axios = require("axios");
const port_redis = 6379;
const { promisify } = require("util");

const asyncRedis = require("async-redis");
const redis_client = asyncRedis.createClient({
    port: process.env.REDIS_PORT,               // replace with your port
    host: process.env.REDIS_HOST,        // replace with your hostanme or IP address
    password: process.env.REDIS_PASSWORD   // replace with your password
});


var sellOrderBookSummary = async (crypto, currency) => {
    await logger.info({
        "module": "Sell Order Book Query Started",
        "user_id": "user_" + crypto, currency,
        "url": "Sell Function",
        "type": "info"
    }, new Date());
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

    // console.log("sellBookOrder", sellBookOrder)

    var totalQuantity = 0.0;
    for (let index = 0; index < sellBookOrder.length; index++) {
        const element = sellBookOrder[index];
        // console.log("element", element);
        // console.log("element.quantity", element.quantity)
        totalQuantity = parseFloat(totalQuantity) + parseFloat(element.quantity);
        // console.log("totalQuantity", totalQuantity)
    }

    // var totalSql = `SELECT SUM(quantity) as total
    //                     FROM sell_book WHERE settle_currency='${crypto}' AND currency='${currency}'
    //                     AND deleted_at IS NULL AND quantity > 0 AND limit_price > 0 
    //                     LIMIT 100`

    // var totalData = await SellBookModel.knex().raw(totalSql)
    // console.log("totalData", totalData)

    var pair = `${crypto}-${currency}`

    var sellTotal = {
        "data": sellBookOrder,
        "total": totalQuantity,
        "name": pair
    }

    await logger.info({
        "module": "Sell Order Book Query Ended",
        "user_id": "user_" + crypto, currency,
        "url": "Sell Function",
        "type": "info"
    }, new Date());

    // redis_client.setex(`sell-book-${pair}`, 10, JSON.stringify(sellTotal));

    return (sellTotal)
}

module.exports = {
    sellOrderBookSummary
}