// var amqp = require('amqplib/callback_api');
// let CONN_URL = process.env.QUEUE_URL;
// const opt = { credentials: require('amqplib').credentials.plain(process.env.QUEUE_USERNAME, process.env.QUEUE_PASSWORD) };
// let ch = null;
// amqp.connect(CONN_URL, opt, (err, conn) => {
//     // console.log("conn", conn)
//     console.log("err", err)
//     conn.createChannel(function (err, channel) {
//         // ch.chequeQueue(queueName);
//         channel.prefetch(3)
//         ch = channel;
//         console.log("process.env.QUEUE_NAME", process.env.QUEUE_NAME)
//         ch.consume(process.env.QUEUE_NAME, (msg, err) => {
//             // console.log("mesages");
//             console.log(err)
//             console.log("Message", msg.content.toString())
//             var tradeData = require("./TradeController");
//             var dataValue = JSON.parse(msg.content.toString());
//             var type = dataValue.order_type
//             console.log("dataValue", dataValue)
//             switch (type) {
//                 case "Market":
//                     if (dataValue.side == "Buy") {
//                         tradeData.makeMarketBuyOrder(dataValue.symbol, dataValue.side, dataValue.order_type, dataValue.orderQuantity, dataValue.user_id, dataValue.res, dataValue.crypto, dataValue.currency)
//                             .then((orderDataResponse) => {
//                                 console.log("orderDataResponse", orderDataResponse)
//                                 ch.ack(msg)
//                             })
//                             .catch((err) => {
//                                 console.log(err)
//                                 ch.ack(msg)
//                             })
//                         break;
//                     } else if (dataValue.side == "Sell") {
//                         tradeData.makeMarketSellOrder(dataValue.res, dataValue.object, dataValue.crypto, dataValue.currency)
//                             .then((orderDataResponse) => {
//                                 console.log("orderDataResponse", orderDataResponse)
//                                 ch.ack(msg)
//                             })
//                             .catch((err) => {
//                                 console.log(err)
//                                 ch.ack(msg)
//                             })
//                         break;
//                     }
//                 case "Limit":
//                     if (dataValue.side == "Buy") {
//                         tradeData.limitBuyOrder(dataValue.symbol, dataValue.user_id, dataValue.side, dataValue.order_type, dataValue.orderQuantity, dataValue.limit_price, dataValue.res, dataValue.flag, dataValue.crypto, dataValue.currency)
//                             .then((orderDataResponse) => {
//                                 console.log("orderDataResponse", orderDataResponse)
//                                 ch.ack(msg)
//                             })
//                             .catch((err) => {
//                                 console.log(err)
//                                 ch.ack(msg)
//                             })
//                         break;
//                     } else if (dataValue.side == "Sell") {
//                         tradeData.limitSellOrder(dataValue.symbol, dataValue.user_id, dataValue.side, dataValue.order_type, dataValue.orderQuantity, dataValue.limit_price, dataValue.res, dataValue.flag, dataValue.crypto, dataValue.currency)
//                             .then((orderDataResponse) => {
//                                 console.log("orderDataResponse", orderDataResponse)
//                                 ch.ack(msg)
//                             })
//                             .catch((err) => {
//                                 console.log(err)
//                                 ch.ack(msg)
//                             })
//                         break;
//                     }
//                 // break;
//                 default:
//                     break;
//             }
//         }, { noAck: false })
//         // conn.close();
//     });
// });

// var publishToQueue = async (queueName, data) => {
//     try {
//         var priorityValue = 1;
//         if (data.order_type == "Limit" && data.flag == true) {
//             // if(data.flag == f)
//             priorityValue = null;
//         }
//         ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
//             persistent: true,
//             priority: priorityValue
//         });
//         return 0;
//     } catch (error) {
//         console.log(error)
//         return 1;
//     }
// }

// module.exports = {
//     publishToQueue
// }
// process.on('exit', (code) => {
//     ch.close();
//     console.log(`Closing rabbitmq channel`);
// });
