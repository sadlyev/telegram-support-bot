const ticketService = require('../services/ticket.service');
const userService = require('../services/user.service');
const telegramService = require('../services/telegram.service');

module.exports = async (ctx) => {
  if (!ctx.message || !ctx.message.text) return;

  if (ctx.from.id == Number(process.env.ADMIN_ID) && ctx.message.reply_to_message) return;

  const user = await userService.findByTelegramId(ctx.from.id);
  if (!user || !user.is_registered) {
    return ctx.reply("Iltimos, avval /start buyrug'i orqali ro'yxatdan o'ting.");
  }

  try {
    const ticket = await ticketService.getOrCreateTicket(ctx.from.id);
    await ticketService.logMessage(ticket.id, ctx.from.id, ctx.message.text);

    // Format used by bot.js regex
    await telegramService.notifyAdmin(
      `📩 *Yangi murojaat*\n` +
      `👤 *Ism:* ${user.first_name}\n` +
      `📞 *Tel:* ${user.phone_number}\n\n` +
      `❓ *Savol:* ${ctx.message.text}\n\n` +
      `🆔 ID: ${ctx.from.id}` 
    );

    await ctx.reply("Sizning xabaringiz yuborildi. Tez orada admin javob beradi!");
  } catch (error) {
    console.error("UserMessage handler error:", error);
    await ctx.reply("Xabarni yuborishda xatolik yuz berdi.");
  }
};
