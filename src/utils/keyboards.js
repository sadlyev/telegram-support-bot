const { Markup } = require('telegraf');

module.exports = {
  contactRequest: () => Markup.keyboard([
    Markup.button.contactRequest('📱 Share Phone Number')
  ]).resize().oneTime()
};
