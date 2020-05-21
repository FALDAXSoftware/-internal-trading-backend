var amqp = require('amqplib/callback_api');
const CONN_URL = process.env.QUEUE_URL;
console.log("CONN_URL", CONN_URL)
let ch = null;
amqp.connect(CONN_URL, function (err, conn) {
    console.log("err", err)
    console.log("conn", conn)
    conn.createChannel(function (err, channel) {
        // ch.chequeQueue(queueName);
        channel.prefetch(1)
        ch = channel;
        ch.consume('orders-execution', (msg) => {
            console.log("mesages");
            console.log("Message", msg.content.toString())
            var tradeData = require("./TradeController");
            var dataValue = JSON.parse(msg.content.toString());
            var type = dataValue.order_type
            console.log("dataValue", dataValue)
            switch (type) {
                case "Market":
                    if (dataValue.side == "Buy") {
                        tradeData.makeMarketBuyOrder(dataValue.symbol, dataValue.side, dataValue.order_type, dataValue.orderQuantity, dataValue.user_id, dataValue.res, dataValue.crypto, dataValue.currency)
                            .then((orderDataResponse) => {
                                console.log("orderDataResponse", orderDataResponse)
                                ch.ack(msg)
                            })
                            .catch((err) => {
                                console.log(err)
                                ch.ack(msg)
                            })
                        break;
                    } else if (dataValue.side == "Sell") {
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
                    if (dataValue.side == "Buy") {
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
                    } else if (dataValue.side == "Sell") {
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
        conn.close();
    });
});

var publishToQueue = async (queueName, data) => {
    try {
        console.log("queueName", queueName)
        console.log("data", data)
        ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
            persistent: true
        });
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    publishToQueue
}
process.on('exit', (code) => {
    ch.close();
    console.log(`Closing rabbitmq channel`);
});