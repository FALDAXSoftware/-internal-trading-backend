/* Used to store CronJobs  */
var cron = require('node-cron');
// var simplexController = require('../controllers/v1/SimplexController');
var cronData = require("../controllers/v1/CronController");

// On Every Minute
cron.schedule('* * * * *', async (req, res, next) => {
    console.log("Started cron....");
    // await cronData.bitcoinistNewsUpdate();
    // await cronData.bitcoinistNewsUpdate();
    // await cronData.coinTelegraph();
});