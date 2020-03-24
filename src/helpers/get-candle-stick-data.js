var moment = require('moment');
var TradeHistoryModel = require("../models/TradeHistory");

getCandleData = async (crypto, currency, time_peroid, from, to) => {

    var from = moment
        .unix(from)
        .utc()
        .format("YYYY-MM-DD HH:mm:ss")

    var to = moment
        .unix(to)
        .utc()
        .format("YYYY-MM-DD HH:mm:ss")

    var openSql = `SELECT id, fill_price, TO_TIMESTAMP(floor(extract(EPOCH FROM created_At)/(60* ${time_peroid}))*(60*${time_peroid})) as interval 
                FROM trade_history 
                WHERE settle_currency = '${crypto}' AND currency = '${currency}' 
                AND id IN (SELECT min(id) FROM trade_history 
                    WHERE created_at >= '${from}' AND created_at <= '${to}' 
                    GROUP BY TO_TIMESTAMP(floor(extract(EPOCH FROM created_At)/(60*${time_peroid}))*(60*${time_peroid}))) 
                ORDER BY interval`
    var openResult = await TradeHistoryModel.knex().raw(openSql)

    var closeSql = `SELECT id, fill_price, TO_TIMESTAMP(floor(extract(EPOCH FROM created_At)/(60*${time_peroid}))*(60*${time_peroid})) as interval 
                        FROM trade_history WHERE settle_currency = '${crypto}' AND currency = '${currency}'
                        AND id IN (SELECT max(id) FROM trade_history 
                                WHERE created_at >= '${from}' AND created_at <= '${to}' 
                                GROUP BY TO_TIMESTAMP(floor(extract(EPOCH FROM created_At)/(60*${time_peroid}))*(60*${time_peroid}))) 
                        ORDER BY interval`
    var closeResult = await TradeHistoryModel.knex().raw(closeSql);

    var highSql = `SELECT max(fill_price) as fill_price, TO_TIMESTAMP(floor(extract(EPOCH FROM created_At)/(60*${time_peroid}))*(60*${time_peroid})) as interval 
                        FROM trade_history WHERE settle_currency = '${crypto}' AND currency = '${currency}'
                        AND created_at >= '${from}' AND created_at <= '${to}' 
                        GROUP BY interval ORDER BY interval`
    var highResult = await TradeHistoryModel.knex().raw(highSql);

    var lowSql = `SELECT min(fill_price) as fill_price, TO_TIMESTAMP(floor(extract(EPOCH FROM created_At)/(60*${time_peroid}))*(60*${time_peroid})) as interval 
                        FROM trade_history WHERE settle_currency = '${crypto}' AND currency = '${currency}'
                        AND created_at >= '${from}' AND created_at <= '${to}' 
                        GROUP BY interval ORDER BY interval`
    var lowResult = await TradeHistoryModel.knex().raw(lowSql);

    var volumeSql = `SELECT sum(quantity) as quantity, TO_TIMESTAMP(floor(extract(EPOCH FROM created_At)/(60*${time_peroid}))*(60*${time_peroid})) as interval 
                        FROM trade_history WHERE settle_currency = '${crypto}' AND currency = '${currency}'
                        AND created_at >= '${from}' AND created_at <= '${to}' 
                        GROUP BY interval ORDER BY interval`
    var volumeResult = await TradeHistoryModel.knex().raw(volumeSql);

    var open = [];
    var close = [];
    var high = [];
    var low = [];
    var time = [];
    var volume = [];
    // var candleStickData;

    for (var i = 0; i < openResult.rows.length; i++) {
        if (openResult.rows[i] !== undefined) {
            open.push(openResult.rows[i].fill_price);
            time.push(moment.utc(openResult.rows[i].interval).unix());
        }
        if (closeResult.rows[i] !== undefined)
            close.push(closeResult.rows[i].fill_price);
        if (highResult.rows[i] !== undefined)
            high.push(highResult.rows[i].fill_price);
        if (lowResult.rows[i] !== undefined)
            low.push(lowResult.rows[i].fill_price);
        if (volumeResult.rows[i] !== undefined)
            volume.push(volumeResult.rows[i].quantity);
        // volume.push()
    }
    var candleStickData = {
        o: open,
        h: high,
        l: low,
        c: close,
        t: time,
        v: volume
    }

    return candleStickData;
}

module.exports = {
    getCandleData
}