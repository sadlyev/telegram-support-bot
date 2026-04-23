const { Telegraf } = require('telegraf');
const startHandler = require('./handlers/start.handler');
const contactHandler = require('./handlers/contact.handler');
const userMessageHandler = require('./handlers/userMessage.handler');
const adminReplyHandler = require('./handlers/adminReply.handler');
const adminOnly = require('./middlewares/adminOnly');
const ticketService = require('./services/ticket.service');

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL = process.env.CHANNEL_ID;

// 1. Basic Commands
bot.start(startHandler);
bot.on('contact', contactHandler);
bot.command('reply', adminOnly, adminReplyHandler);

// 2. Helper: Extract Question & Answer from the confirmation panel
const getQA = (text) => {
    try {
        const qMatch = text.match(/❓ Savol:\s*([\s\S]*?)\n💡/i);
        const aMatch = text.match(/💡 Javobingiz:\s*([\s\S]*?)$/i);
        return {
            question: qMatch ? qMatch[1].trim() : "Savol topilmadi",
            answer: aMatch ? aMatch[1].trim() : "Javob topilmadi"
        };
    } catch (e) {
        return { question: "Xatolik", answer: "Xatolik" };
    }
};

// 3. ADMIN REPLY DETECTION (When you swipe-right on a user's message)
bot.on('text', adminOnly, async (ctx, next) => {
    // Check if this is a reply to a bot notification
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.from.id === ctx.botInfo.id) {
        const replyToText = ctx.message.reply_to_message.text || "";
        const idMatch = replyToText.match(/ID:\s*(\d+)/i);
        const qMatch = replyToText.match(/❓ Savol:\s*([\s\S]*?)\n\n/i);

        if (idMatch) {
            const userId = idMatch[1];
            const userQuestion = qMatch ? qMatch[1].trim() : "Savol topilmadi";
            const adminAnswer = ctx.message.text;

            try {
                const ticket = await ticketService.getOrCreateTicket(userId);
                return await ctx.reply(
                    `📝 **Tasdiqlash paneli:**\n\n` +
                    `👤 **User ID:** \`${userId}\`\n` +
                    `❓ **Savol:** ${userQuestion}\n` +
                    `💡 **Javobingiz:** ${adminAnswer}`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "👤 User Only", callback_data: `send_user_${ticket.id}_${userId}` },
                                    { text: "📢 Post to Channel", callback_data: `post_all_${ticket.id}_${userId}` }
                                ],
                                [ { text: "❌ Disapprove", callback_data: `disapprove_${ticket.id}` } ]
                            ]
                        }
                    }
                );
            } catch (err) {
                console.error("Reply Error:", err);
            }
        }
    }
    return next(); // If not a reply, move to userMessageHandler
});

// --- ACTION HANDLERS ---

bot.action(/^send_user_(\d+)_(\d+)$/, adminOnly, async (ctx) => {
    const [_, ticketId, userId] = ctx.match;
    const { answer } = getQA(ctx.callbackQuery.message.text);
    try {
        await ctx.telegram.sendMessage(userId, `🎧 *Admin javobi:* ${answer}`, { parse_mode: 'Markdown' });
        await ctx.editMessageText(`✅ Faqat foydalanuvchiga yuborildi.\n\n💡 *Javob:* ${answer}`);
    } catch (err) {
        await ctx.answerCbQuery("User botni bloklagan!");
    }
});

bot.action(/^post_all_(\d+)_(\d+)$/, adminOnly, async (ctx) => {
    const [_, ticketId, userId] = ctx.match;
    const { question, answer } = getQA(ctx.callbackQuery.message.text);
    try {
        await ctx.telegram.sendMessage(CHANNEL, `❓ *Savol:* ${question}\n\n💡 *Javob:* ${answer}`, { parse_mode: 'Markdown' });
        try {
            await ctx.telegram.sendMessage(userId, `🎧 *Admin javobi:* ${answer}`, { parse_mode: 'Markdown' });
            await ctx.editMessageText(`✅ Kanalga joylandi va foydalanuvchiga yuborildi.\n\n❓ ${question}\n💡 ${answer}`);
        } catch (e) {
            await ctx.editMessageText(`⚠️ Kanalga joylandi, lekin user botni bloklagan.`);
        }
        if (ticketService.updateStatus) await ticketService.updateStatus(ticketId, 'posted');
    } catch (err) {
        await ctx.answerCbQuery("Xatolik!");
    }
});

bot.action(/^disapprove_(\d+)$/, adminOnly, (ctx) => ctx.editMessageText("❌ Bekor qilindi."));

// 4. Catch-all for Users
bot.on('text', userMessageHandler);

module.exports = { bot };
