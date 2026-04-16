// src/services/telegram.service.js
module.exports = {
  async notifyAdmin(message) {
    // Move the require INSIDE the function to break the circle
    const { bot } = require('../bot'); 
    return bot.telegram.sendMessage(process.env.ADMIN_ID, message, { parse_mode: 'Markdown' });
  }
};
