const { Telegraf } = require('telegraf');
const config = require('./config');
const startHandler = require('./handlers/start.handler');
const contactHandler = require('./handlers/contact.handler');
const userMessageHandler = require('./handlers/userMessage.handler');
const adminReplyHandler = require('./handlers/adminReply.handler');
const adminOnly = require('./middlewares/adminOnly');

const bot = new Telegraf(process.env.BOT_TOKEN);

// 1. Initial Start
bot.start(startHandler);

// 2. Handle the Phone Number share event
bot.on('contact', contactHandler);

// 3. Admin Command: /reply [id] [text]
bot.command('reply', adminOnly, adminReplyHandler);

// 4. Catch-all for messages
bot.on('text', userMessageHandler);

module.exports = { bot };
