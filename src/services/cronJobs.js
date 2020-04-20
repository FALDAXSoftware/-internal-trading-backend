/* Used to store CronJobs  */
var cron = require('node-cron');
// var simplexController = require('../controllers/v1/SimplexController');
var cronData = require("../controllers/v1/TradeController");

// On Every Minute
cron.schedule('*/2 * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await cronData.executeStopLimit();
});