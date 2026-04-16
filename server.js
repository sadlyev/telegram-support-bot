require('dotenv').config();
const app = require('./src/app');
const { bot } = require('./src/bot');


const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Use Polling for Railway - it's simpler than setting up Webhooks
  bot.launch()
    .then(() => console.log('🤖 Bot is polling for messages...'))
    .catch((err) => console.error('Bot launch error:', err));
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
