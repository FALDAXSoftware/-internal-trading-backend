const Influx = require('influx');
var { AppController } = require('./AppController');
var TradeHistoryModel = require("../../models/TradeHistoryInflux");
var CoinsModel = require("../../models/Coins");
var Fees = require("../../models/Fees");
var moment = require('moment');

const influx = new Influx.InfluxDB({
    host: process.env.INFLUX_HOST,
    port: process.env.INFLUX_PORT,
    database: process.env.INFLUX_DATABASE,
    username: process.env.INFLUX_USERNAME,
    password: process.env.INFLUX_PASSWORD,
    schema: [
        {
            measurement: 'trade_history_xrp_btc',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_eth_btc',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_ltc_btc',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_susu_btc',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_bch_btc',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_bch_eth',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_ltc_eth',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_xrp_eth',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_btc_pax',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_eth_pax',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_ltc_pax',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_xrp_pax',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        },
        {
            measurement: 'trade_history_bch_pax',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT
            },
            tags: [
                'pair'
            ]
        }
    ]
})

class InfluxController extends AppController {

    constructor() {
        super();
    }

    async writeInfluxData(req, res) {
        try {

            console.log("influx", influx)

            // var pair_name = "xrpbtc";
            var {
                pair_name,
                limit,
                offset,
                table_name,
                date,
                pair
            } = req.query;
            var now = moment().format();
            console.log("now", now);
            console.log(pair_name,
                limit,
                offset,
                table_name)


            var tradeData = await TradeHistoryModel
                .query()
                .select()
                .where("deleted_at", null)
                .andWhere("symbol", pair)
                .andWhere("created_at", "<=", "2020-08-27T00:00:00")
                .orderBy("id", "DESC")
                .offset(offset)
                .limit(limit);

            console.log("tradeData", tradeData.length)

            for (var i = 0; i < tradeData.length; i++) {
                console.log("i", i)
                var existing = moment(tradeData[i].created_at).valueOf() * 1000000;
                await influx.writePoints([
                    {
                        measurement: table_name,
                        tags: { pair: pair_name },
                        timestamp: existing,
                        fields: {
                            price: parseFloat(tradeData[i].fill_price),
                            amount: parseFloat(tradeData[i].quantity)
                        }
                    }])
                    .then(() => {
                        console.log('Added data to the Db');
                    });
            }
            return res.status(200);
        } catch (error) {
            console.log(error)
        }
    }

    async getInfluxData(req, res) {
        try {
            var {
                period,
                from,
                to,
                pair,
                limit
            } = req.query;
            console.log("limit", limit)
            var value = (limit == undefined) ? (1440) : (limit);
            var dataValue = await influx.query(`
                            SELECT first(price) AS open, last(price) AS close, 
                            max(price) AS high, min(price) AS low, sum(amount) AS volume 
                            FROM abcgh WHERE pair='${pair}' AND 
                            time > '${from}'  AND time < '${to}' 
                            GROUP BY time(${period})
                            LIMIT ${value}
                        `)

            console.log("dataValue", dataValue);
            console.log("data", (dataValue.groupRows[0].rows).length);
            var o = [];
            var c = [];
            var l = [];
            var h = [];
            var v = [];
            var t = [];
            var candleStickData = {};
            for (var i = 0; i < (dataValue.groupRows[0].rows).length; i++) {
                t.push(moment(dataValue.groupRows[0].rows[i].time).valueOf());
                o.push(dataValue.groupRows[0].rows[i].open);
                c.push(dataValue.groupRows[0].rows[i].close);
                l.push(dataValue.groupRows[0].rows[i].low);
                h.push(dataValue.groupRows[0].rows[i].high);
                v.push(dataValue.groupRows[0].rows[i].volume);
            }
            candleStickData = {
                o: o,
                h: h,
                l: l,
                c: c,
                t: t,
                v: v
            }
            return res
                .status(200)
                .json({
                    "status": 200,
                    "message": "Candle Data success",
                    data: candleStickData
                })
        } catch (error) {
            console.log("error", error)
        }
    }

    async deleteInfluxData(req, res) {
        var dataValue = await influx.query(`
                            SELECT *
                            FROM trade_history_xrp_btc WHERE price=0
                        `)
        console.log("(dataValue.groupRows[0].rows).length", (dataValue.groupRows[0].rows).length)
        for (var i = 0; i < (dataValue.groupRows[0].rows).length; i++) {
            console.log("i", i)
            console.log("dataValue.groupRows[0].rows[i].time", (dataValue.groupRows[0].rows[i].time).valueOf() * 1000000)
            var dataValueO = await influx.query(`
                                                DELETE
                                                FROM trade_history_xrp_btc WHERE time=${(dataValue.groupRows[0].rows[i].time).valueOf() * 1000000}
                                    `)
        }
        return res.status(200);
    }

    async getUserTradeData(req, res) {
        var {
            user_id
        } = req.query;

        let userTradeHistorySum = {}

        if (user_id != process.env.TRADEDESK_USER_ID) {
            var now = moment().format();
            var yesterday = moment(now)
                .subtract(1, 'months')
                .format();
            // console.log("INSIDE IF USEr")
            let userTradesum = await TradeHistoryModel.knex().raw(`SELECT (a1.sum+a2.sum) as total, a1.sum as user_sum, a2.sum as requested_sum , a1.user_coin ,a2.requested_coin
                                                                            FROM(SELECT user_coin, 
                                                                                SUM((CASE
                                                                                    WHEN side='Buy' THEN ((quantity)*Cast(fiat_values->>'asset_1_usd' as double precision))
                                                                                    WHEN side='Sell' THEN ((quantity*fill_price)*Cast(fiat_values->>'asset_2_usd' as double precision))
                                                                                  END)) as sum
                                                                                 FROM trade_history
                                                                            WHERE user_id = ${user_id} AND created_at >= '${yesterday}' AND created_at <= '${now}' GROUP BY user_coin) a1
                                                                            FULL JOIN (SELECT requested_coin, 
                                                                                SUM((CASE
                                                                                    WHEN side='Buy' THEN ((quantity*fill_price)*Cast(fiat_values->>'asset_1_usd' as double precision))
                                                                                    WHEN side='Sell' THEN ((quantity)*Cast(fiat_values->>'asset_2_usd' as double precision))
                                                                                  END)) as sum
                                                                                FROM trade_history
                                                                            WHERE requested_user_id = ${user_id} AND created_at >= '${yesterday}' AND created_at <= '${now}' GROUP BY requested_coin) as a2
                                                                            ON a1.user_coin = a2.requested_coin`)

            console.log("userTradesum", userTradesum.rows)
            for (let index = 0; index < userTradesum.rows.length; index++) {
                const element = userTradesum.rows[index];
                userTradeHistorySum[element.user_coin ? element.user_coin : element.requested_coin] = element.total ? element.total : (element.user_sum ? element.user_sum : element.requested_sum)
            }
        }

        let userTotalUSDSum = 0
        if (Object.keys(userTradeHistorySum).length != 0) {
            var entries = Object.entries(userTradeHistorySum);
            entries.forEach(([key, value]) => {
                userTotalUSDSum += value
            });
        } else {
            userTotalUSDSum = 0.0;
        }

        var totalCurrencyAmount = userTotalUSDSum;

        var currencyMakerFee = await Fees
            .query()
            .first()
            .select('maker_fee', 'taker_fee')
            .where('deleted_at', null)
            .andWhere('min_trade_volume', '<=', parseFloat(totalCurrencyAmount))
            .andWhere('max_trade_volume', '>=', parseFloat(totalCurrencyAmount));
        var takerFee = currencyMakerFee.taker_fee
        var makerFee = currencyMakerFee.maker_fee

        return res
            .status(200)
            .json({
                "status": 200,
                "message": "User Fee has been retrieved successfully",
                totalCurrencyAmount: totalCurrencyAmount + "USD",
                takerFee,
                makerFee
            })
    }

    async getTier0Report(req, res) {
        try {
            var tierReport = require("../../helpers/tier-0-report");

            var data = await tierReport.userTier0Report(req.query.user_id, req.query.amount, req.query.crypto);
            console.log("data", data)

            return res
                .status(200)
                .json({
                    "status": 200,
                    "data": data
                })
        } catch (error) {
            console.log(error);
        }
    }

    async getUserTier0DataReport(req, res) {
        try {
            var {
                user_id
            } = req.query;

            var now = moment().format();
            var yesterday = moment(now)
                .subtract(1, 'months')
                .format();

            var getUserTradeHistory = await TradeHistoryModel
                .query()
                .select("fiat_values", "quantity", "fill_price", "side", "user_id", "requested_user_id")
                .where(builder => {
                    builder.where('user_id', user_id)
                        .orWhere('requested_user_id', user_id)
                })
                // .where("user_id", user_id)
                .andWhere("created_at", '>=', yesterday)
                .orderBy("id", "DESC")
            // .limit(100);
            console.log("getUserTradeHistory", getUserTradeHistory)

            return res
                .status(200)
                .json({
                    "status": 200,
                    "data": getUserTradeHistory
                });

        } catch (error) {
            console.log("error", error)
        }
    }
}
module.exports = new InfluxController();