const ticketService = require('../services/ticket.service');
const userService = require('../services/user.service');
const telegramService = require('../services/telegram.service');

module.exports = async (ctx) => {
  if (!ctx.message || !ctx.message.text) return;

  // Ignore if Admin is replying
  if (ctx.from.id == Number(process.env.ADMIN_ID) && ctx.message.reply_to_message) return;

  const user = await userService.findByTelegramId(ctx.from.id);
  if (!user || !user.is_registered) {
    return ctx.reply("Iltimos, avval /start buyrug'i orqali ro'yxatdan o'ting.");
  }

  try {
    const ticket = await ticketService.getOrCreateTicket(ctx.from.id);
    await ticketService.logMessage(ticket.id, ctx.from.id, ctx.message.text);

    // Notification format for the Admin
    await telegramService.notifyAdmin(
      `📩 *Yangi murojaat*\n` +
      `👤 *Ism:* ${user.first_name}\n\n` +
      `❓ *Savol:* ${ctx.message.text}\n\n` +
      `🆔 ID: ${ctx.from.id}` 
    );

    await ctx.reply("Xabaringiz yuborildi. Admin tez orada javob beradi!");
  } catch (error) {
    console.error("UserMessage Error:", error);
    await ctx.reply("Xabarni yuborishda xatolik yuz berdi.");
  }
};
