var amqp = require('amqplib/callback_api');
let CONN_URL = process.env.QUEUE_URL;
const opt = { credentials: require('amqplib').credentials.plain(process.env.QUEUE_USERNAME, process.env.QUEUE_PASSWORD) };
let ch = null;
// console.log("CONN_URL", CONN_URL)
amqp.connect(CONN_URL, opt, (err, conn) => {
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("conn", conn)
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("err", err)
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    // console.log("---------------------------------");
    conn.createChannel(function (err, channel) {
        // ch.chequeQueue(queueName);
        channel.assertQueue(process.env.PENDING_QUEUE_NAME)
        channel.assertQueue(process.env.QUEUE_NAME + '-' + 'Buy', {
            maxPriority: 2
        });
        channel.assertQueue(process.env.QUEUE_NAME + '-' + 'Sell', {
            maxPriority: 2
        });
        channel.prefetch(1)
        ch = channel;
        // console.log("ch", ch)
        // console.log("process.env.QUEUE_NAME", process.env.QUEUE_NAME)
        ch.consume(process.env.PENDING_QUEUE_NAME, async (msg, err) => {
            // console.log("msg", msg)
            // console.log("err", JSON.stringify(err))
            var PendingOrderExecutionModel = require("../../models/PendingOrdersExecutuions");
            var dataValue = JSON.parse(msg.content.toString());
            // console.log("dataValue", dataValue)
            var pendingDataStatus = await PendingOrderExecutionModel
                .query()
                .first()
                .select("is_cancel")
                .where("id", dataValue.pending_order_id)
                .andWhere("deleted_at", null)
                .orderBy("id", "DESC");

            // console.log("pendingDataStatus", pendingDataStatus)
            // console.log("pendingDataStatus.is_cancel", pendingDataStatus.is_cancel)

            if (pendingDataStatus != undefined && pendingDataStatus.is_cancel == false) {
                // console.log("dataValue.side", dataValue.side)
                // console.log("INSIDE IF", (process.env.QUEUE_NAME + '-' + dataValue.side));
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
            // console.log(JSON.stringify(err))
            // console.log("Message", msg.content.toString())
            var PendingOrderExecutionModel = require("../../models/PendingOrdersExecutuions");
            var tradeData = require("./TradeController");
            var dataValue = JSON.parse(msg.content.toString());
            var type = dataValue.order_type
            if (dataValue.pending_order_id) {
                var pendingDataStatus = await PendingOrderExecutionModel
                    .query()
                    .first("is_cancel")
                    .select()
                    .where("id", dataValue.pending_order_id)
                    .andWhere("deleted_at", null)
                    .orderBy("id", "DESC");

                if (pendingDataStatus != undefined) {
                    var pendinfStatusValue = await PendingOrderExecutionModel
                        .query()
                        .where("id", dataValue.pending_order_id)
                        .andWhere("deleted_at", null)
                        .patch({
                            is_under_execution: true
                        });

                    global.io.sockets.to(pendingDataStatus.crypto + "-" + pendingDataStatus.currency + pendingDataStatus.user_id).emit("users-completed-flag", true)
                }
            }

            // console.log("pendingDataStatus", pendingDataStatus)
            // console.log("dataValue", dataValue)
            // if (pendingDataStatus != undefined) {
            switch (type) {
                case "Market":
                    if (dataValue.side == "Buy" && pendingDataStatus.is_cancel == false) {
                        tradeData.makeMarketBuyOrder(dataValue.symbol, dataValue.side, dataValue.order_type, dataValue.orderQuantity, dataValue.user_id, dataValue.res, dataValue.crypto, dataValue.currency, [], 0.0, dataValue.pending_order_id, dataValue.is_checkbox_enabled)
                            .then((orderDataResponse) => {
                                // console.log("orderDataResponse", orderDataResponse)
                                ch.ack(msg)
                            })
                            .catch((err) => {
                                // console.log(JSON.stringify(err))
                                ch.ack(msg)
                            })
                        break;
                    }
                case "Limit":
                    if (dataValue.side == "Buy" && (dataValue.pending_order_id == undefined || pendingDataStatus.is_cancel == false)) {
                        console.log("dataValue", dataValue)
                        tradeData.limitBuyOrder(dataValue.symbol, dataValue.user_id, dataValue.side, dataValue.order_type, dataValue.orderQuantity, dataValue.limit_price, dataValue.res, dataValue.flag, dataValue.crypto, dataValue.currency, [], dataValue.pending_order_id, dataValue.is_checkbox_enabled)
                            .then((orderDataResponse) => {
                                // console.log("orderDataResponse", orderDataResponse)
                                ch.ack(msg)
                            })
                            .catch((err) => {
                                // console.log(JSON.stringify(err))
                                ch.ack(msg)
                            })
                        break;
                    }
                // break;
                default:
                    break;
            }
            // }
        }, { noAck: false })
        ch.consume(process.env.QUEUE_NAME + '-' + 'Sell', async (msg, err) => {
            // console.log("mesages");
            // console.log(JSON.stringify(err))
            // console.log("Message", msg.content.toString())
            var PendingOrderExecutionModel = require("../../models/PendingOrdersExecutuions");
            var tradeData = require("./TradeController");
            var dataValue = JSON.parse(msg.content.toString());
            var type = dataValue.order_type
            if (dataValue.pending_order_id) {
                var pendingDataStatus = await PendingOrderExecutionModel
                    .query()
                    .first("is_cancel")
                    .select()
                    .where("id", dataValue.pending_order_id)
                    .andWhere("deleted_at", null)
                    .orderBy("id", "DESC");

                if (pendingDataStatus != undefined) {
                    var pendingValue = await PendingOrderExecutionModel
                        .query()
                        .where("id", dataValue.pending_order_id)
                        .andWhere("deleted_at", null)
                        .patch({
                            is_under_execution: true
                        })
                    // if (type == "Market") {
                    global.io.sockets.to(pendingDataStatus.crypto + "-" + pendingDataStatus.currency + pendingDataStatus.user_id).emit("users-completed-flag", true)
                    // } else if (type == "Limit") {
                    //     global.io.sockets.to(pendingDataStatus.crypto + "-" + pendingDataStatus.currency + pendingDataStatus.user_id).emit("users-completed-flag", true)
                    // }
                }
            }

            // console.log("pendingDataStatus", pendingDataStatus)
            // console.log("dataValue", dataValue)

            // if (pendingDataStatus != undefined) {
            switch (type) {
                case "Market":
                    if (dataValue.side == "Sell" && pendingDataStatus.is_cancel == false) {
                        // console.log("dataValue", dataValue)
                        tradeData.makeMarketSellOrder(dataValue.res, dataValue.object, dataValue.crypto, dataValue.currency, [], 0.0, dataValue.pending_order_id)
                            .then((orderDataResponse) => {
                                // console.log("orderDataResponse", orderDataResponse)
                                ch.ack(msg)
                            })
                            .catch((err) => {
                                // console.log(JSON.stringify(err))
                                ch.ack(msg)
                            })
                        break;
                    }
                case "Limit":
                    if (dataValue.side == "Sell" && (dataValue.pending_order_id == undefined || pendingDataStatus.is_cancel == false)) {
                        tradeData.limitSellOrder(dataValue.symbol, dataValue.user_id, dataValue.side, dataValue.order_type, dataValue.orderQuantity, dataValue.limit_price, dataValue.res, dataValue.flag, dataValue.crypto, dataValue.currency, [], dataValue.pending_order_id)
                            .then((orderDataResponse) => {
                                // console.log("orderDataResponse", orderDataResponse)
                                ch.ack(msg)
                            })
                            .catch((err) => {
                                // console.log(JSON.stringify(err))
                                ch.ack(msg)
                            })
                        break;
                    }
                // break;
                default:
                    break;
            }
            // }
        }, { noAck: false })
        // conn.close();
    });
});

var publishToQueue = async (queueName, data) => {
    try {
        // console.log({
        //     queueName,
        //     data
        // });
        var dataValue = ch.assertQueue(queueName);
        ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
            persistent: true
        });

        return 0;
    } catch (error) {
        // console.log(JSON.stringify(error))
        return 1;
    }
}

var cronPublishToQueue = async (queueName, data) => {
    try {
        // console.log({
        //     queueName,
        //     data
        // });
        var dataValue = ch.assertQueue(queueName, {
            maxPriority: 2
        });
        var priorityValue = 1;
        if (data.order_type == "Limit" && data.user_id == process.env.TRADEDESK_USER_ID) {
            priorityValue = null;
        }
        ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
            persistent: true,
            priority: priorityValue
        });

        return 0;
    } catch (error) {
        // console.log(JSON.stringify(error))
        return 1;
    }
}

module.exports = {
    publishToQueue,
    cronPublishToQueue
}

process.on('exit', (code) => {
    ch.close();
    // console.log(`Closing rabbitmq channel`);
});
