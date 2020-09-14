var BuyBookModel = require("../../models/BuyBook");
const {
    raw
} = require('objection');

// Redis
const redis = require("redis");
const axios = require("axios");
const port_redis = 6379;
const { promisify } = require("util");

var logger = require("../../controllers/v1/logger");

const asyncRedis = require("async-redis");
const redis_client = asyncRedis.createClient({
    port: process.env.REDIS_PORT,               // replace with your port
    host: process.env.REDIS_HOST,        // replace with your hostanme or IP address
    password: process.env.REDIS_PASSWORD   // replace with your password
});


var getBuyBookOrderSummary = async (crypto, currency) => {

    await logger.info({
        "module": "Buy Order Book Query Started",
        "user_id": "user_" + crypto, currency,
        "url": "Buy Function",
        "type": "info"
    }, new Date());

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

    var totalQuantity = 0.0;
    var totalQuantityFill = 0.0;
    for (let index = 0; index < buyBookOrders.length; index++) {
        const element = buyBookOrders[index];
        totalQuantity = parseFloat(totalQuantity) + parseFloat(element.quantity);
        totalQuantityFill = parseFloat(totalQuantityFill) + parseFloat(element.quantity * element.price)
    }

    var pair = `${crypto}-${currency}`
    console.log("pair", pair)

    var buyTotal = {
        "data": buyBookOrders,
        "total": totalQuantityFill,
        "total_quantity": totalQuantity,
        "name": pair
    }

    await logger.info({
        "module": "Buy Order Book Query Ended",
        "user_id": "user_" + crypto, currency,
        "url": "Buy Function",
        "type": "info"
    }, new Date());

    // redis_client.setex(`buy-book-${pair}`, 10, JSON.stringify(buyTotal));

    return (buyTotal)
}

module.exports = {
    getBuyBookOrderSummary
}