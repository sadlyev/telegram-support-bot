const { Telegraf } = require('telegraf');
const config = require('./config');
const startHandler = require('./handlers/start.handler');
const contactHandler = require('./handlers/contact.handler');
const userMessageHandler = require('./handlers/userMessage.handler');
const adminReplyHandler = require('./handlers/adminReply.handler');
const adminOnly = require('./middlewares/adminOnly');
const ticketService = require('./services/ticket.service');

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL = process.env.CHANNEL_ID;

bot.start(startHandler);
bot.on('contact', contactHandler);
bot.command('reply', adminOnly, adminReplyHandler);

// 1. ADMIN REPLY DETECTION (Swipe-right on message)
bot.on('text', adminOnly, async (ctx, next) => {
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.from.id === ctx.botInfo.id) {
        const replyToText = ctx.message.reply_to_message.text || "";
        
        // Extract User ID and original Question using Regex
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
                    `👤 **Foydalanuvchi:** \`${userId}\`\n` +
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
                                [
                                    { text: "❌ Disapprove", callback_data: `disapprove_${ticket.id}` }
                                ]
                            ]
                        }
                    }
                );
            } catch (err) {
                console.error("Reply error:", err);
            }
        }
    }
    return next();
});

// Helper to extract data from the confirmation panel for the buttons
const getQA = (text) => {
    try {
        const question = text.split('Savol:** ')[1].split('\n💡')[0];
        const answer = text.split('Javobingiz:** ')[1].trim();
        return { question: question.trim(), answer };
    } catch (e) {
        return { question: "Savol topilmadi", answer: "Javob topilmadi" };
    }
};

// --- ACTION HANDLERS ---

// A. Send to User Only
bot.action(/^send_user_(\d+)_(\d+)$/, adminOnly, async (ctx) => {
    const [_, ticketId, userId] = ctx.match;
    const { answer } = getQA(ctx.callbackQuery.message.text);

    try {
        await ctx.telegram.sendMessage(userId, `🎧 *Admin javobi:* ${answer}`, { parse_mode: 'Markdown' });
        await ctx.editMessageText(`✅ Xabar faqat foydalanuvchiga yuborildi.`);
    } catch (err) {
        await ctx.answerCbQuery("User botni bloklagan!");
    }
});

// B. Post to Channel + Send to User
bot.action(/^post_all_(\d+)_(\d+)$/, adminOnly, async (ctx) => {
    const [_, ticketId, userId] = ctx.match;
    const { question, answer } = getQA(ctx.callbackQuery.message.text);

    try {
        await ctx.telegram.sendMessage(CHANNEL, `❓ *Savol:* ${question}\n\n💡 *Javob:* ${answer}`, { parse_mode: 'Markdown' });
        
        try {
            await ctx.telegram.sendMessage(userId, `🎧 *Admin javobi:* ${answer}`, { parse_mode: 'Markdown' });
            await ctx.editMessageText(`✅ Kanalga joylandi va foydalanuvchiga yuborildi.`);
        } catch (e) {
            await ctx.editMessageText(`⚠️ Kanalga joylandi, lekin user botni bloklagan.`);
        }

        if (ticketService.updateStatus) await ticketService.updateStatus(ticketId, 'posted');
        await ctx.answerCbQuery("Bajarildi!");
    } catch (err) {
        await ctx.answerCbQuery("Kanalga yuborishda xatolik!");
    }
});

bot.action(/^disapprove_(\d+)$/, adminOnly, (ctx) => ctx.editMessageText("❌ Bekor qilindi."));

bot.on('text', userMessageHandler);
module.exports = { bot };
