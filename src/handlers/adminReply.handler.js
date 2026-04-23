const ticketService = require('../services/ticket.service');

module.exports = async (ctx) => {
  const args = ctx.message.text.split(' ');
  const targetId = args[1]; 
  const message = args.slice(2).join(' ');

  if (!targetId || !message) {
    return ctx.reply("⚠️ Foydalanish formati: /reply [UserID] [Xabar]");
  }

  try {
    const ticket = await ticketService.getOrCreateTicket(targetId);
    
    // Log the admin's message to the DB
    await ticketService.logMessage(ticket.id, ctx.from.id, message);

    // we use a placeholder for "Savol" since /reply is a manual command
    await ctx.reply(
      `📝 **Tasdiqlash paneli:**\n\n` +
      `👤 **User ID:** \`${targetId}\`\n` +
      `❓ **Savol:** (Manual Reply via command)\n` + 
      `💡 **Javobingiz:** ${message}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: "👤 Send to User Only", callback_data: `send_user_${ticket.id}_${targetId}` },
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
    console.error(err);
    await ctx.reply("❌ Xatolik yuz berdi. User ID ni tekshiring.");
  }
};
