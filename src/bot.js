const { Telegraf } = require('telegraf');
const startHandler = require('./handlers/start.handler');
const contactHandler = require('./handlers/contact.handler');
const userMessageHandler = require('./handlers/userMessage.handler');
const adminReplyHandler = require('./handlers/adminReply.handler');
const adminOnly = require('./middlewares/adminOnly');
const ticketService = require('./services/ticket.service');

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL = process.env.CHANNEL_ID;

// 1. Initial Commands
bot.start(startHandler);
bot.on('contact', contactHandler);

// 2. Admin Command
bot.command('reply', adminOnly, adminReplyHandler);

// 3. Helper: Extract Q&A from Panel
const getQA = (text) => {
    const qMatch = text.match(/❓ Savol:\s*([\s\S]*?)\n💡/i);
    const aMatch = text.match(/💡 Javobingiz:\s*([\s\S]*?)$/i);
    return {
        question: qMatch ? qMatch[1].trim() : "...",
        answer: aMatch ? aMatch[1].trim() : "..."
    };
};

// 4. Admin Swipe-Reply Detection
// Note: adminOnly is ONLY triggered here if it's a reply to the bot
bot.on('text', async (ctx, next) => {
    const isBotReply = ctx.message.reply_to_message && 
                       ctx.message.reply_to_message.from.id === ctx.botInfo.id;

    if (isBotReply) {
        // Run admin check ONLY for replies
        return adminOnly(ctx, next);
    }
    // If not a reply, move to userMessageHandler
    return next();
}, async (ctx) => {
    const replyToText = ctx.message.reply_to_message.text || "";
    const idMatch = replyToText.match(/ID:\s*(\d+)/i);
    const qMatch = replyToText.match(/❓ Savol:\s*([\s\S]*?)\n\n🆔/i);

    if (idMatch) {
        const userId = idMatch[1];
        const userQuestion = qMatch ? qMatch[1].trim() : "Savol topilmadi";
        const ticket = await ticketService.getOrCreateTicket(userId);
        
        return await ctx.reply(
            `📝 **Tasdiqlash paneli:**\n\n👤 **User ID:** \`${userId}\`\n❓ **Savol:** ${userQuestion}\n💡 **Javobingiz:** ${ctx.message.text}`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "👤 User Only", callback_data: `send_user_${ticket.id}_${userId}` },
                            { text: "📢 Post to Channel", callback_data: `post_all_${ticket.id}_${userId}` }
                        ],
                        [{ text: "❌ Disapprove", callback_data: `disapprove` }]
                    ]
                }
            }
        );
    }
});

// --- ACTION HANDLERS ---

bot.action(/^send_user_(\d+)_(\d+)$/, adminOnly, async (ctx) => {
    const [_, ticketId, userId] = ctx.match;
    const { answer } = getQA(ctx.callbackQuery.message.text);
    try {
        await ctx.telegram.sendMessage(userId, `🎧 *Admin javobi:* ${answer}`, { parse_mode: 'Markdown' });
        await ctx.editMessageText(`✅ Userga yuborildi.\n\n💡 *Javob:* ${answer}`);
    } catch (e) { await ctx.answerCbQuery("Bloklangan!"); }
});

bot.action(/^post_all_(\d+)_(\d+)$/, adminOnly, async (ctx) => {
    const [_, ticketId, userId] = ctx.match;
    const { question, answer } = getQA(ctx.callbackQuery.message.text);
    try {
        await ctx.telegram.sendMessage(CHANNEL, `❓ *Savol:* ${question}\n\n💡 *Javob:* ${answer}`, { parse_mode: 'Markdown' });
        await ctx.editMessageText(`✅ Kanalga joylandi.\n\n❓ ${question}\n💡 ${answer}`);
        if (ticketService.updateStatus) await ticketService.updateStatus(ticketId, 'posted');
    } catch (err) { await ctx.answerCbQuery("Xatolik!"); }
});

bot.action('disapprove', adminOnly, (ctx) => ctx.editMessageText("❌ Bekor qilindi."));

// 5. Catch-all for regular Users (NO adminOnly here)
bot.on('text', userMessageHandler);

module.exports = { bot };
