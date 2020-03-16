var PendingBookModel = require("../../models/PendingBook");

var addPendingBook = async (orderData) => {
    var addPendingData = await PendingBookModel
        .query()
        .insertAndFetch({
            ...orderData
        });

    return (addPendingData);
}

module.exports = {
    addPendingBook
}