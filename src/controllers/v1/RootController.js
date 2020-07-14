const Influx = require('influx');
var { AppController } = require('./AppController');
var TradeHistoryModel = require("../../models/TradeHistory");
var moment = require('moment');
// var moment = require('moment-timezone');

const influx = new Influx.InfluxDB({
    host: 'localhost',
    // port: 8086,
    database: 'abcgh',
    schema: [
        {
            measurement: 'abcgh',
            // time: Influx.FieldType.STRING,
            fields: {
                price: Influx.FieldType.FLOAT,
                amount: Influx.FieldType.FLOAT,
                side: Influx.FieldType.STRING
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

            var pair_name = "xrpbtc";

            console.log("pair_name", pair_name)
            var tradeData = await TradeHistoryModel
                .query()
                .select()
                .where("deleted_at", null)
                .andWhere("symbol", "XRP-BTC")
                .orderBy("id", "DESC")
                .offset(100300)
                .limit(50);

            console.log("tradeData", tradeData.length)
            for (var i = 0; i < 10000; i++) {
                // console.log("i", moment(tradeData[i].created_at).tz("Europe/Paris").format());
                console.log("i", i)
                // var value = parseInt(1525777200000);

                var existing = moment(tradeData[i].created_at).valueOf();
                // var tz = moment.tz.guess();
                // var value = existing.tz(tz).format()
                // existing = existing * 1e6;
                console.log("value", existing)
                await influx.writePoints([
                    {
                        measurement: 'abcgh',
                        tags: { pair: pair_name },
                        timestamp: existing,
                        fields: {
                            price: parseFloat(tradeData[i].fill_price),
                            amount: parseFloat(tradeData[i].quantity),
                            side: parseFloat(tradeData[i].side)
                        }
                    }])
                    .then(() => {
                        console.log('Added data to the Db');
                    });
            }
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
                pair
            } = req.query;
            var dataValue = await influx.query(`
            SELECT first(price) AS open, last(price) AS close, 
            max(price) AS high, min(price) AS low, sum(amount) AS volume 
            FROM abcgh WHERE pair='${pair}' AND 
            time > '${from}'  AND time < '${to}' 
            GROUP BY time(${period})
          `)

            // console.log("dataValue", dataValue);
            console.log("data", (dataValue.groupRows[0].rows).length);
            for (var i = 0; i < (dataValue.groupRows[0].rows).length; i++) {
                dataValue.groupRows[0].rows[i].time = moment(dataValue.groupRows[0].rows[i].time).valueOf();
            }
            return res
                .status(200)
                .json({
                    "status": 200,
                    "message": "Candle Data success",
                    data: dataValue.groupRows[0].rows
                })
        } catch (error) {
            console.log("error", error)
        }
    }
}
module.exports = new InfluxController();