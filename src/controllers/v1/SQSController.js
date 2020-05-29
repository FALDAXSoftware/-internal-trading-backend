var aws = require('aws-sdk');
var queue_url = process.env.SQS_QUEUE_URL;

var __dirname = "/Users/openxcell/faldax-internal/internal-trading-backend/src/config"

aws.config.loadFromPath(__dirname + '/aws_config.json');
// aws.config.update({ apiVersion: '2012-11-05', region: 'us-east-1' });

var sqs = new aws.SQS({ apiVersion: '2012-11-05', region: 'us-east-2' });

var sendToSQS = async (data) => {

    const accountId = 496403030999;
    const queueName = "faldax-sqs-test-ohio.fifo";
    const queueRegion = "us-east-2";
    const params = {
        MessageBody: JSON.stringify({
            "symbol": "ETH-BTC",
            "side": "Sell",
            "order_type": "Market",
            "orderQuantity": "1"
        }),
        QueueUrl: `https://sqs.${queueRegion}.amazonaws.com/${accountId}/${queueName}`,
        DelaySeconds: 0,
        MessageGroupId: "MessageGroup1"
    };
    sqs.sendMessage(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data.MessageId);
        }
    });
}

var params = {
    MaxNumberOfMessages: 1,
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
    } else if (data.Messages) {
        console.log("data", data)
        var deleteParams = {
            QueueUrl: queue_url,
            ReceiptHandle: data.Messages[0].ReceiptHandle
        };
        sqs.deleteMessage(deleteParams, function (err, data) {
            if (err) {
                console.log("Delete Error", err);
            } else {
                console.log("Message Deleted", data);
            }
        });
    }
});

module.exports = {
    sendToSQS,
    // getSQSData
}