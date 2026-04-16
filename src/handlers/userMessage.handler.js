const ticketService = require('../services/ticket.service');
const userService = require('../services/user.service');
const telegramService = require('../services/telegram.service');

module.exports = async (ctx) => {
  // 1. Safety check for text
  if (!ctx.message || !ctx.message.text) return;

  // 2. Ignore if Admin is typing (Admins use /reply)
  // Use Number() to ensure the comparison works
  if (ctx.from.id == Number(process.env.ADMIN_ID)) {
    return ctx.reply("Admin, use /reply [UserID] [Message] to respond.");
  }

  // 3. Check if user exists
  const user = await userService.findByTelegramId(ctx.from.id);
  if (!user || !user.is_registered) {
    return ctx.reply("Please use /start to register first.");
  }

  try {
    // 4. Log to Database
    const ticket = await ticketService.getOrCreateTicket(ctx.from.id);
    await ticketService.logMessage(ticket.id, ctx.from.id, ctx.message.text);

    // 5. Notify Admin
    await telegramService.notifyAdmin(
      `📩 *New Support Request*\n` +
      `User: ${user.first_name}\n` +
      `Phone: ${user.phone_number}\n` +
      `ID: \`${ctx.from.id}\`\n\n` +
      `*Message:* ${ctx.message.text}`
    );

    await ctx.reply("Your message was sent to support. Please wait for a reply!");
  } catch (error) {
    console.error("Error in userMessage handler:", error);
    await ctx.reply("Sorry, something went wrong while sending your message.");
  }
};
