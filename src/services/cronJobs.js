/* Used to store CronJobs  */
var cron = require('node-cron');
// var simplexController = require('../controllers/v1/SimplexController');
var cronData = require("../controllers/v1/TradeController");
var dashBoardUpdate = require("../controllers/v1/DashboardController");

// On Every Minute
cron.schedule('*/2 * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await cronData.executeStopLimit();
});

cron.schedule('*/30 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await dashBoardUpdate.updateBuyOrderBook("LTC-BTC");
});

cron.schedule('*/30 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await dashBoardUpdate.updateSellOrderBook("LTC-BTC");
});

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder();
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder();
})