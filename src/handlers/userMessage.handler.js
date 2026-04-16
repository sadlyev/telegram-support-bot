const ticketService = require('../services/ticket.service');
const userService = require('../services/user.service');
const telegramService = require('../services/telegram.service');

module.exports = async (ctx) => {
  // 1. Matn borligini tekshirish
  if (!ctx.message || !ctx.message.text) return;

  // 2. Agar Admin yozayotgan bo'lsa (Adminlar /reply ishlatadi)
  if (ctx.from.id == Number(process.env.ADMIN_ID)) {
    return ctx.reply("Admin, javob berish uchun /reply [UserID] [Xabar] formatidan foydalaning.");
  }

  // 3. Foydalanuvchi ro'yxatdan o'tganini tekshirish
  const user = await userService.findByTelegramId(ctx.from.id);
  if (!user || !user.is_registered) {
    return ctx.reply("Iltimos, avval /start buyrug'i orqali ro'yxatdan o'ting.");
  }

  try {
    // 4. Ma'lumotlar bazasiga saqlash
    const ticket = await ticketService.getOrCreateTicket(ctx.from.id);
    await ticketService.logMessage(ticket.id, ctx.from.id, ctx.message.text);

    // 5. Adminga xabar yuborish
    await telegramService.notifyAdmin(
      `📩 *Yangi murojaat*\n` +
      `Ism: ${user.first_name}\n` +
      `Tel: ${user.phone_number}\n` +
      `ID: \`${ctx.from.id}\`\n\n` +
      `*Xabar:* ${ctx.message.text}`
    );

    await ctx.reply("Sizning xabaringiz yuborildi. Tez orada admin javob beradi!");
  } catch (error) {
    console.error("UserMessage handler xatosi:", error);
    await ctx.reply("Uzr, xabarni yuborishda xatolik yuz berdi.");
  }
};
