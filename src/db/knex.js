const knex = require('knex');
const config = require('../../knexfile');

// This instance will be used by all services
const db = knex(config);

module.exports = db;