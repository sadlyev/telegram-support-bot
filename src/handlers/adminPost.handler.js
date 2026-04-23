const ticketService = require('../services/ticket.service');

module.exports = async (ctx) => {
  const args = ctx.message.text.split(' ');
  const ticketId = args[1];

  if (!ticketId) {
    return ctx.reply("Foydalanish: /post [ticketId]");
  }

  try {
    const ticket = await ticketService.getTicketById(ticketId);

    if (!ticket) {
      return ctx.reply("Ticket topilmadi");
    }

    // Show the admin a preview with Approve/Cancel buttons
    await ctx.reply(
      `📝 **Post Preview (Ticket #${ticketId}):**\n\n${ticket.message}\n\nKanalga yuborilsinmi?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              // We pass the ticketId in the callback_data so the bot knows which one to post
              { text: "✅ Tasdiqlash (Post)", callback_data: `send_post:${ticketId}` },
              { text: "❌ Bekor qilish", callback_data: `cancel_post` }
            ]
          ]
        }
      }
    );
  } catch (err) {
    console.error(err);
    await ctx.reply("Xatolik yuz berdi");
  }
};
