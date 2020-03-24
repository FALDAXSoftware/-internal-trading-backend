/*
Get Card data
 */
var moment = require('moment');
var CoinsModel = require("../../models/Coins");
var TradeHistoryModel = require("../../models/TradeHistory");
var Currency = require("../../helpers/currency");
var getCardData = async (symbol) => {
    var card_data = [];
    var current_price = 0;
    var previous_price = 0;
    var flag = true;
    let { crypto, currency } = await Currency.get_currencies(symbol);
    // Get Coin Data
    let coinData = await CoinsModel
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('is_active', true)
        .andWhere('coin', crypto);


    var yesterday = moment
        .utc()
        .subtract(1, 'days')
        .format();
    var today = moment
        .utc()
        .format();

    var total_price = 0;
    var average_price = 0;

    // Get data from yesterday till now
    var price = await TradeHistoryModel
        .query()
        .where('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('deleted_at', null)
        .andWhere('created_at', '>=', yesterday)
        .orderBy('id', 'DESC');

    if (price.length == 0) {
        average_price = 0;
    } else {
        for (var i = 0; i < price.length; i++) {
            total_price = total_price + price[i]['fill_price'];
        }
        average_price = total_price / (price.length);
    }

    // Get Data of Yesterday to today
    var current = await TradeHistoryModel
        .query()
        .where('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('deleted_at', null)
        .andWhere('created_at', '>=', yesterday)
        .andWhere('created_at', '<=', today)
        .orderBy('id', 'DESC');

    if (current == undefined || current.length == 0) {
        current_price = 0;
    } else {
        current_price = current[0]['fill_price'];
    }
    // Get Previous data
    var previous = await TradeHistoryModel
        .query()
        .where('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('deleted_at', null)
        .andWhere('created_at', '>=', yesterday)
        .orderBy('id', 'DESC');

    if (previous == undefined || previous.length == 0) {
        previous_price = 0;
    } else {
        previous_price = previous[0]['fill_price'];
    }

    var diffrrence = current_price - previous_price;
    var percentchange = (diffrrence / current_price) * 100;

    if (isNaN(percentchange) || percentchange == "-Infinity") {
        percentchange = 0;
    } else {
        percentchange = percentchange;
    }

    if (diffrrence < 0) {
        flag = false;
    } else {
        flag = true;
    }
    // Get  data of yesterday
    var tradeOrderDetails = await TradeHistoryModel
        .query()
        .where('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('deleted_at', null)
        .andWhere('created_at', '>=', yesterday)
        .orderBy('id', 'DESC');

    card_data = {
        "currency": currency,
        "settle_currency": crypto,
        "average_price": average_price,
        "diffrence": diffrrence,
        "percentchange": percentchange,
        "flag": flag,
        "tradeChartDetails": tradeOrderDetails,
        "icon": coinData.coin_icon
    }
    return card_data;
}

module.exports = {
    getCardData
}