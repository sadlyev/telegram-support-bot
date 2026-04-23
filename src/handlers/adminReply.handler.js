const ticketService = require('../services/ticket.service');

module.exports = async (ctx) => {
  const args = ctx.message.text.split(' ');
  const targetId = args[1]; 
  const message = args.slice(2).join(' ');

  if (!targetId || !message) return ctx.reply("⚠️ /reply [UserID] [Xabar]");

  try {
    const ticket = await ticketService.getOrCreateTicket(targetId);
    await ticketService.logMessage(ticket.id, ctx.from.id, message);

    await ctx.reply(
      `📝 **Tasdiqlash paneli:**\n\n` +
      `👤 **Foydalanuvchi:** \`${targetId}\`\n` +
      `❓ **Savol:** (Manual Reply)\n` + 
      `💡 **Javob:** ${message}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: "👤 User Only", callback_data: `send_user_${ticket.id}_${targetId}` },
              { text: "📢 Post to Channel", callback_data: `post_all_${ticket.id}_${targetId}` }
            ],
            [
              { text: "❌ Disapprove", callback_data: `disapprove_${ticket.id}` }
            ]
          ]
        }
      }
    );
  } catch (err) {
    ctx.reply("❌ Xatolik yuz berdi.");
  }
};
