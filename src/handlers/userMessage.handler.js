const ticketService = require('../services/ticket.service');
const userService = require('../services/user.service');
const telegramService = require('../services/telegram.service');

module.exports = async (ctx) => {
  if (!ctx.message || !ctx.message.text) return;

  const adminIdEnv = process.env.ADMIN_ID || "";
  const adminIds = adminIdEnv.split(',').map(id => id.trim());

  // Prevent admins from triggering user flow
  if (adminIds.includes(ctx.from.id.toString())) {
    if (ctx.message.reply_to_message) return;
    return ctx.reply("Admin, foydalanuvchiga javob berish uchun swipe-reply (o'ngga surish) dan foydalaning.");
  }

  const user = await userService.findByTelegramId(ctx.from.id);
  if (!user || !user.is_registered) {
    return ctx.reply("Iltimos, avval /start buyrug'i orqali ro'yxatdan o'ting.");
  }

  try {
    const ticket = await ticketService.getOrCreateTicket(ctx.from.id);
    await ticketService.logMessage(ticket.id, ctx.from.id, ctx.message.text);

    await telegramService.notifyAdmin(
      `📩 *Yangi murojaat*\n` +
      `👤 *Ism:* ${user.first_name}\n\n` +
      `❓ *Savol:* ${ctx.message.text}\n\n` +
      `🆔 ID: ${ctx.from.id}` 
    );

    await ctx.reply("Xabaringiz yuborildi. Admin tez orada javob beradi!");
  } catch (error) {
    console.error(error);
    await ctx.reply("Xatolik yuz berdi.");
  }
};
