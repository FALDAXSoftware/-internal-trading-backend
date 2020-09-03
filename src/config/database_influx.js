function DB() {

}


DB.prototype.connect = function (db) {
    return require('knex')({
        client: process.env.DB_CONNECTION,
        connection: {
            host: process.env.READ_DB_HOST,
            port: process.env.READ_DB_PORT,
            user: process.env.READ_DB_USERNAME,
            password: process.env.READ_DB_PASSWORD,
            database: process.env.READ_DB_DATABASE
        },
    });
};

module.exports = DB;