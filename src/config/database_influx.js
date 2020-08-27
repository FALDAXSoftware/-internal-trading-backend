const { Model } = require('objection');
const Knex = require('knex');
// Initialize knex.

const knex_inlfux = Knex({
    client: process.env.DB_CONNECTION,
    connection: {
        host: process.env.DB_HOST_INFLUX,
        port: process.env.DB_PORT_INFLUX,
        user: process.env.DB_USERNAME_INFLUX,
        password: process.env.DB_PASSWORD_INFLUX,
        database: process.env.DB_DATABASE_INFLUX
    },
    pool: {
        min: 1,
        max: 10
        // propagateCreateError: false
    }
});

console.log("knex_inlfux", knex_inlfux.client)

// Give the knex object to objection.
Model.knex(knex_inlfux);
module.exports = Model;