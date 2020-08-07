// // // /* Used to store CronJobs  */
var cron = require('node-cron');
var cronData = require("../controllers/v1/TradeController");
var dashBoardUpdate = require("../controllers/v1/DashboardController");
var cardDataController = require("../controllers/v1/UserFavourites")

// // // // On Every Minute
cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await cronData.executeStopLimit();
});

// Cron for LTC-BTC
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("LTC-BTC");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("LTC-BTC");
// });
cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await Promise.all([
        dashBoardUpdate.updateBuyOrderBookValue("LTC-BTC"),
        // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
    ])
});

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//   console.log("Started cron....");
//   await Promise.all([
//       dashBoardUpdate.updateBuyOrderBookValue("LTC-BTC"),
//       // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
//   ])
// });

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder("LTC-BTC");
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder("LTC-BTC");
})

// Cron For XRP-BTC
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("XRP-BTC");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("XRP-BTC");
// });
cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await Promise.all([
        dashBoardUpdate.updateBuyOrderBookValue("XRP-BTC"),
        // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
    ])
});

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await Promise.all([
//         dashBoardUpdate.updateBuyOrderBookValue("XRP-BTC"),
//         // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
//     ])
// });

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder("XRP-BTC");
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder("XRP-BTC");
})

// //  Cron for ETH-BTC
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("ETH-BTC");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("ETH-BTC");
// });

cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await Promise.all([
        dashBoardUpdate.updateBuyOrderBookValue("ETH-BTC"),
        // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
    ])
});

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await Promise.all([
//         dashBoardUpdate.updateBuyOrderBookValue("ETH-BTC"),
//         // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
//     ])
// });

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder("ETH-BTC");
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder("ETH-BTC");
})

// //  Cron for BCH-BTC
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("BCH-BTC");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("BCH-BTC");
// });

cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await Promise.all([
        dashBoardUpdate.updateBuyOrderBookValue("BCH-BTC"),
        // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
    ])
});

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await Promise.all([
//         dashBoardUpdate.updateBuyOrderBookValue("BCH-BTC"),
//         // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
//     ])
// });

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder("BCH-BTC");
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder("BCH-BTC");
})

//  Cron for LTC-ETH
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("LTC-ETH");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("LTC-ETH");
// });

cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await Promise.all([
        dashBoardUpdate.updateBuyOrderBookValue("LTC-ETH"),
        // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
    ])
});

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await Promise.all([
//         dashBoardUpdate.updateBuyOrderBookValue("LTC-ETH"),
//         // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
//     ])
// });

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder("LTC-ETH");
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder("LTC-ETH");
})

//  Cron for XRP-ETH
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("XRP-ETH");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("XRP-ETH");
// });

cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await Promise.all([
        dashBoardUpdate.updateBuyOrderBookValue("XRP-ETH"),
        // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
    ])
});

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await Promise.all([
//         dashBoardUpdate.updateBuyOrderBookValue("XRP-ETH"),
//         // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
//     ])
// });

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder("XRP-ETH");
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder("XRP-ETH");
})

//  Cron for BCH-ETH
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

// Cron for BTC-PAX
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("BTC-PAX");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("BTC-PAX");
// });
cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await Promise.all([
        dashBoardUpdate.updateBuyOrderBookValue("BTC-PAX"),
        // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
    ])
});

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder("BTC-PAX");
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder("BTC-PAX");
})

// Cron for LTC-PAX
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("LTC-PAX");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("LTC-PAX");
// });
cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await Promise.all([
        dashBoardUpdate.updateBuyOrderBookValue("LTC-PAX"),
        // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
    ])
});

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder("LTC-PAX");
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder("LTC-PAX");
})


// Cron for BCH-PAX
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("BCH-PAX");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("BCH-PAX");
// });
cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await Promise.all([
        dashBoardUpdate.updateBuyOrderBookValue("BCH-PAX"),
        // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
    ])
});

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder("BCH-PAX");
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder("BCH-PAX");
})

// Cron for ETH-PAX
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("ETH-PAX");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("ETH-PAX");
// });
cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await Promise.all([
        dashBoardUpdate.updateBuyOrderBookValue("ETH-PAX"),
        // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
    ])
});

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder("ETH-PAX");
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder("ETH-PAX");
})

// Cron for XRP-PAX
// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateBuyOrderBook("XRP-PAX");
// });

// cron.schedule('*/15 * * * * *', async (req, res, next) => {
//     console.log("Started cron....");
//     await dashBoardUpdate.updateSellOrderBook("XRP-PAX");
// });
cron.schedule('*/15 * * * * *', async (req, res, next) => {
    console.log("Started cron....");
    await Promise.all([
        dashBoardUpdate.updateBuyOrderBookValue("XRP-PAX"),
        // dashBoardUpdate.updateSellOrderBook("XRP-BTC")
    ])
});

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deletePendingOrder("XRP-PAX");
})

cron.schedule('* * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await dashBoardUpdate.deleteSellPendingOrder("XRP-PAX");
})

cron.schedule('*/10 * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await cardDataController.updatePairCache("LTC-BTC");
})

cron.schedule('*/10 * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await cardDataController.updatePairCache("XRP-BTC");
})

cron.schedule('*/10 * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await cardDataController.updatePairCache("ETH-BTC");
})

cron.schedule('*/10 * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await cardDataController.updatePairCache("BCH-BTC");
})

cron.schedule('*/10 * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await cardDataController.updatePairCache("BCH-ETH");
})

cron.schedule('*/10 * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await cardDataController.updatePairCache("LTC-ETH");
})

cron.schedule('*/10 * * * *', async (req, res, next) => {
    console.log("INISDER FGJ");
    await cardDataController.updatePairCache("XRP-ETH");
})

cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getInstrumentDataValue();
})
cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("LTC-BTC");
})

cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("XRP-BTC");
})
cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("ETH-BTC");
})

cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("BCH-BTC");
})
cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("SUSU-BTC");
})
cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("BCH-PAX");
})
cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("BCH-ETH");
})
cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("LTC-ETH");
})
cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("XRP-ETH");
})
cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("BTC-PAX");
})
cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("ETH-PAX");
})
cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("XRP-PAX");
})
cron.schedule('*/10 * * * * *', async (req, res, next) => {
    console.log("INSIDE CRON")
    await dashBoardUpdate.getDepthChartDetails("LTC-PAX");
})