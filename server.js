require('dotenv').config();
const app = require('./src/app');
const { bot } = require('./src/bot');

bot.start((ctx) => ctx.reply("Bot working"));

app.post("/webhook", (req, res) => {
  bot.handleUpdate(req.body, res);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on ${PORT}`);

  await bot.telegram.setWebhook(
    "https://telegram-support-bot-k95h.onrender.com/webhook"
  );

  console.log("Webhook set");
});