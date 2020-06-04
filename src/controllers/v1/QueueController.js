var amqp = require('amqplib/callback_api');
let CONN_URL = process.env.QUEUE_URL;
const opt = { credentials: require('amqplib').credentials.plain(process.env.QUEUE_USERNAME, process.env.QUEUE_PASSWORD) };
let ch = null;
amqp.connect(CONN_URL, opt, (err, conn) => {
    // console.log("conn", conn)
    console.log("err", err)
    conn.createChannel(function (err, channel) {
        // ch.chequeQueue(queueName);
        channel.assertQueue(process.env.PENDING_QUEUE_NAME)
        channel.assertQueue(process.env.QUEUE_NAME + '-' + 'Buy');
        channel.assertQueue(process.env.QUEUE_NAME + '-' + 'Sell');
        channel.prefetch(1)
        ch = channel;
        console.log("process.env.QUEUE_NAME", process.env.QUEUE_NAME)
        ch.consume(process.env.PENDING_QUEUE_NAME, async (msg, err) => {
            var PendingOrderExecutionModel = require("../../models/PendingOrdersExecutuions");
            var dataValue = JSON.parse(msg.content.toString());
            console.log("dataValue", dataValue)
            var pendingDataStatus = await PendingOrderExecutionModel
                .query()
                .first("is_cancel")
                .select()
                .where("id", dataValue.pending_order_id)
                .andWhere("deleted_at", null)
                .orderBy("id", "DESC");

            console.log("pendingDataStatus", pendingDataStatus)

            if (pendingDataStatus != undefined && pendingDataStatus.is_cancel == false) {
                var priorityValue = 1;
                ch.sendToQueue(process.env.QUEUE_NAME + '-' + dataValue.side, Buffer.from(JSON.stringify(dataValue)), {
                    persistent: true,
                    priority: priorityValue
                });
                ch.ack(msg)
            }
        }, { noAck: false })
        ch.consume(process.env.QUEUE_NAME + '-' + 'Buy', async (msg, err) => {
            // console.log("mesages");
            console.log(err)
            console.log("Message", msg.content.toString())
            var PendingOrderExecutionModel = require("../../models/PendingOrdersExecutuions");
            var tradeData = require("./TradeController");
            var dataValue = JSON.parse(msg.content.toString());
            var type = dataValue.order_type
            var pendingDataStatus = await PendingOrderExecutionModel
                .query()
                .first("is_cancel")
                .select()
                .where("id", dataValue.pending_order_id)
                .andWhere("deleted_at", null)
                .orderBy("id", "DESC");

            console.log("pendingDataStatus", pendingDataStatus)
            console.log("dataValue", dataValue)
            switch (type) {
                case "Market":
                    if (dataValue.side == "Buy" && pendingDataStatus.is_cancel == false) {
                        tradeData.makeMarketBuyOrder(dataValue.symbol, dataValue.side, dataValue.order_type, dataValue.orderQuantity, dataValue.user_id, dataValue.res, dataValue.crypto, dataValue.currency, [], 0.0, dataValue.pending_order_id)
                            .then((orderDataResponse) => {
                                console.log("orderDataResponse", orderDataResponse)
                                ch.ack(msg)
                            })
                            .catch((err) => {
                                console.log(err)
                                ch.ack(msg)
                            })
                        break;
                    }
                case "Limit":
                    if (dataValue.side == "Buy" && pendingDataStatus.is_cancel == false) {
                        tradeData.limitBuyOrder(dataValue.symbol, dataValue.user_id, dataValue.side, dataValue.order_type, dataValue.orderQuantity, dataValue.limit_price, dataValue.res, dataValue.flag, dataValue.crypto, dataValue.currency)
                            .then((orderDataResponse) => {
                                console.log("orderDataResponse", orderDataResponse)
                                ch.ack(msg)
                            })
                            .catch((err) => {
                                console.log(err)
                                ch.ack(msg)
                            })
                        break;
                    }
                // break;
                default:
                    break;
            }
        }, { noAck: false })
        ch.consume(process.env.QUEUE_NAME + '-' + 'Sell', async (msg, err) => {
            // console.log("mesages");
            console.log(err)
            console.log("Message", msg.content.toString())
            var tradeData = require("./TradeController");
            var dataValue = JSON.parse(msg.content.toString());
            var type = dataValue.order_type
            console.log("dataValue", dataValue)
            switch (type) {
                case "Market":
                    if (dataValue.side == "Sell") {
                        tradeData.makeMarketSellOrder(dataValue.res, dataValue.object, dataValue.crypto, dataValue.currency)
                            .then((orderDataResponse) => {
                                console.log("orderDataResponse", orderDataResponse)
                                ch.ack(msg)
                            })
                            .catch((err) => {
                                console.log(err)
                                ch.ack(msg)
                            })
                        break;
                    }
                case "Limit":
                    if (dataValue.side == "Sell") {
                        tradeData.limitSellOrder(dataValue.symbol, dataValue.user_id, dataValue.side, dataValue.order_type, dataValue.orderQuantity, dataValue.limit_price, dataValue.res, dataValue.flag, dataValue.crypto, dataValue.currency)
                            .then((orderDataResponse) => {
                                console.log("orderDataResponse", orderDataResponse)
                                ch.ack(msg)
                            })
                            .catch((err) => {
                                console.log(err)
                                ch.ack(msg)
                            })
                        break;
                    }
                // break;
                default:
                    break;
            }
        }, { noAck: false })
        // conn.close();
    });
});

var publishToQueue = async (queueName, data) => {
    try {
        console.log({
            queueName,
            data
        });
        var dataValue = ch.assertQueue(queueName);
        ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
            persistent: true
        });

        return 0;
    } catch (error) {
        console.log(error)
        return 1;
    }
}

module.exports = {
    publishToQueue
}

process.on('exit', (code) => {
    ch.close();
    console.log(`Closing rabbitmq channel`);
});
