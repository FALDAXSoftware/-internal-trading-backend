/* Used to store CronJobs  */
var cron = require('node-cron');
// var simplexController = require('../controllers/v1/SimplexController');
var cronData = require("../controllers/v1/TradeController");
var dashBoardUpdate = require("../controllers/v1/DashboardController");

// On Every Minute
// cron.schedule('*/2 * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await cronData.executeStopLimit();
// });

// Cron for LTC-BTC
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("LTC-BTC");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("LTC-BTC");
// });

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deletePendingOrder("LTC-BTC");
// })

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deleteSellPendingOrder("LTC-BTC");
// })

// // Cron For XRP-BTC
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("XRP-BTC");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("XRP-BTC");
// });

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deletePendingOrder("XRP-BTC");
// })

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deleteSellPendingOrder("XRP-BTC");
// })

// //  Cron for ETH-BTC
// cron.schedule('*/30 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("ETH-BTC");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("ETH-BTC");
// });

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deletePendingOrder("ETH-BTC");
// })

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deleteSellPendingOrder("ETH-BTC");
// })

// //  Cron for BCH-BTC
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("BCH-BTC");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("BCH-BTC");
// });

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deletePendingOrder("BCH-BTC");
// })

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deleteSellPendingOrder("BCH-BTC");
// })

// //  Cron for LTC-ETH
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("LTC-ETH");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("LTC-ETH");
// });

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deletePendingOrder("LTC-ETH");
// })

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deleteSellPendingOrder("LTC-ETH");
// })

// //  Cron for XRP-ETH
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("XRP-ETH");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("XRP-ETH");
// });

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deletePendingOrder("XRP-ETH");
// })

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deleteSellPendingOrder("XRP-ETH");
// })

// //  Cron for BCH-ETH
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("BCH-ETH");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("BCH-ETH");
// });

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deletePendingOrder("BCH-ETH");
// })

// cron.schedule('* * * * *', async (req, res, next) => {
//     console.log("INISDER FGJ");
//     await dashBoardUpdate.deleteSellPendingOrder("BCH-ETH");
// })