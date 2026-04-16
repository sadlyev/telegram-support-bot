import express from "express";
import { Telegraf } from "telegraf";

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

app.use(express.json());

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