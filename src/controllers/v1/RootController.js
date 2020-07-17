const Influx = require('influx');
var { AppController } = require('./AppController');
var TradeHistoryModel = require("../../models/TradeHistory");
var moment = require('moment');
// var moment = require('moment-timezone');

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
        }
    ]
})

// console.log("influx", influx)

class InfluxController extends AppController {

    constructor() {
        super();
    }

    async writeInfluxData(req, res) {
        try {

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
            // console.log("now", now);
            console.log(pair_name,
                limit,
                offset,
                table_name)
            var tradeData = await TradeHistoryModel
                .query()
                .select()
                .where("deleted_at", null)
                .andWhere("symbol", "ETH-BTC")
                .andWhere("created_at", "<=", "2020-07-17T10:38:47+05:30")
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
}
module.exports = new InfluxController();