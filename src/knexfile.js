require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: "postgresql://" + (process.env.DB_USERNAME) + ":" + (process.env.DB_PASSWORD) + "@" + (process.env.DB_HOST) + "/" + (process.env.DB_DATABASE),
    migrations: {
      directory: './data/migrations',
    },
    seeds: { directory: './data/seeds' },
  },

  testing: {
    client: 'pg',
    connection: "postgresql://" + (process.env.DB_USERNAME) + ":" + (process.env.DB_PASSWORD) + "@" + (process.env.DB_HOST) + "/" + (process.env.DB_DATABASE),
    migrations: {
      directory: './data/migrations',
    },
    seeds: { directory: './data/seeds' },
  },

  production: {
    client: 'pg',
    connection: "postgresql://" + (process.env.DB_USERNAME) + ":" + (process.env.DB_PASSWORD) + "@" + (process.env.DB_HOST) + "/" + (process.env.DB_DATABASE),
    migrations: {
      directory: './data/migrations',
    },
    seeds: { directory: './data/seeds' },
  },
};