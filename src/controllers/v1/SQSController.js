var aws = require('aws-sdk');
var queue_url = process.env.SQS_QUEUE_URL;

var __dirname = "/Users/openxcell/faldax-internal/internal-trading-backend/src/config"

aws.config.loadFromPath(__dirname + '/aws_config.json');
// aws.config.update({ apiVersion: '2012-11-05', region: 'us-east-1' });

var sqs = new aws.SQS({ apiVersion: '2012-11-05', region: 'us-east-2' });

var sendToSQS = async (data) => {
    var data = {
        "symbol": "ETH-BTC",
        "side": "Sell",
        "order_type": "Market",
        "orderQuantity": "1"
    }
    var params = {
        // DelaySeconds: 1,
        MessageBody: "Information about current NY Times fiction bestseller for week of 12/11/2016.",
        MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
        MessageGroupId: "Group1",  // Required for FIFO queues
        QueueUrl: queue_url
    };
    sqs.sendMessage(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data.MessageId);
        }
    });
}

var getSQSData = async () => {

    var params = {
        MaxNumberOfMessages: 10,
        MessageAttributeNames: [
            "All"
        ],
        QueueUrl: queue_url,
        VisibilityTimeout: 20,
        WaitTimeSeconds: 0
    };
    console.log("INSIDE LIST QUEUE")
    sqs.receiveMessage(params, function (err, data) {
        if (err) {
            console.log("err", err)
            // res.send(err);
        }
        else {
            console.log("data", data)
            // res.send(data);
        }
    });
}

module.exports = {
    sendToSQS,
    getSQSData
}