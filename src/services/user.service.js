const db = require('../db/knex');

module.exports = {
  // Make sure this name is 'registerUser'
  async registerUser(data) {
    return db('users')
      .insert({
        telegram_id: data.id,
        first_name: data.first_name,
        phone_number: data.phone_number,
        is_registered: true
      })
      .onConflict('telegram_id')
      .merge();
  },

  async findByTelegramId(id) {
    return db('users').where({ telegram_id: id }).first();
  }
};
