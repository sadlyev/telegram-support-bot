const ticketService = require('../services/ticket.service');

module.exports = async (ctx) => {
  const args = ctx.message.text.split(' ');
  const targetId = args[1]; 
  const message = args.slice(2).join(' ');

  if (!targetId || !message) {
    return ctx.reply("⚠️ Foydalanish formati: /reply [UserID] [Xabar]");
  }

  try {
    // 1. Get the ticket and save the admin's reply text to the database first
    // This is necessary because button callback_data has a 64-character limit
    const ticket = await ticketService.getOrCreateTicket(targetId);
    
    // We log the message to the DB so the callback handler can retrieve it later
    await ticketService.logMessage(ticket.id, ctx.from.id, message);

    // 2. Reply to the admin with confirmation buttons
    await ctx.reply(
      `📝 **Xabar tayyorlandi:**\n\n**Kimga:** \`${targetId}\`\n**Xabar:** ${message}\n\nUshbu javobni tasdiqlaysizmi?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              // We pass the ticket.id so the bot knows which message to send
              { text: "✅ Approve & Send", callback_data: `approve_${ticket.id}_${targetId}` },
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
