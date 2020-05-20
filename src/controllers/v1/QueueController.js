var amqp = require('amqplib/callback_api');
var tradeData = require("./TradeController");
const CONN_URL = 'amqp://localhost';
let ch = null;
amqp.connect(CONN_URL, function (err, conn) {
    conn.createChannel(function (err, channel) {
        ch = channel;
        ch.consume('orders-execution', (msg) => {
            orderQueueExecution(msg)
        }, { noAck: true })
    });
});
var publishToQueue = async (queueName, data) => {
    console.log("queueName", queueName)
    console.log("data", data)
    ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
        persistent: true
    });
}

var orderQueueExecution = (msg) => {
    console.log("mesages");
    console.log("Message", msg.content.toString())
    var dataValue = JSON.parse(msg.content.toString());
    var type = dataValue.order_type
    switch (type) {
        case "Market":
            if (dataValue.side == "Buy") {
                // try {
                tradeData.makeMarketBuyOrder(dataValue.symbol, dataValue.side, dataValue.order_type, dataValue.orderQuantity, dataValue.user_id, dataValue.res, dataValue.crypto, dataValue.currency)
                    .then((orderDataResponse) => {
                        console.log("orderDataResponse", orderDataResponse)
                    })
                // } catch (error) {
                //     console.log(error)
                // }
            } else if (dataValue.side == "Sell") {

            }
            break;
        case "Limit":

            break;
        default:
            break;
    }
    // ch.ack(msg)
}

module.exports = {
    publishToQueue
}
process.on('exit', (code) => {
    ch.close();
    console.log(`Closing rabbitmq channel`);
});