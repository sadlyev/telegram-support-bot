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

// 4. Admin "Reply to message" detection
bot.on('text', adminOnly, async (ctx, next) => {
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.from.id === ctx.botInfo.id) {
        const replyToText = ctx.message.reply_to_message.text || "";
        
        const idMatch = replyToText.match(/ID:\s*`?(\d+)`?/i);
        // Extract the user's question from the notification text
        const questionMatch = replyToText.match(/\*Xabar:\* ([\s\S]*?)\n\nID:/i);
        
        if (idMatch) {
            const userId = idMatch[1];
            const userQuestion = questionMatch ? questionMatch[1].trim() : "Savol topilmadi";
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
                                    { text: "👤 Send to User Only", callback_data: `send_user_${ticket.id}_${userId}` },
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
                console.error("Reply detection error:", err);
            }
        }
    }
    return next();
});

const getQA = (text) => {
    const question = text.split('Savol:** ')[1].split('\n💡')[0];
    const answer = text.split('Javobingiz:** ')[1].split('\n\n')[0];
    return { question, answer };
};

bot.action(/^send_user_(\d+)_(\d+)$/, adminOnly, async (ctx) => {
    const [_, ticketId, userId] = ctx.match;
    const { answer } = getQA(ctx.callbackQuery.message.text);

    try {
        await ctx.telegram.sendMessage(userId, `🎧 *Admin javobi:* ${answer}`, { parse_mode: 'Markdown' });
        await ctx.editMessageText(`✅ Faqat foydalanuvchiga yuborildi.`);
        await ctx.answerCbQuery("Userga yuborildi");
    } catch (err) {
        await ctx.answerCbQuery("Foydalanuvchi botni bloklagan!");
    }
});

// 2. Post to Channel (Includes Question and Answer)
bot.action(/^post_all_(\d+)_(\d+)$/, adminOnly, async (ctx) => {
    const [_, ticketId, userId] = ctx.match;
    const { question, answer } = getQA(ctx.callbackQuery.message.text);

    try {
        // Post to Channel
        await ctx.telegram.sendMessage(
            CHANNEL, 
            `❓ *Savol:* ${question}\n\n💡 *Javob:* ${answer}`, 
            { parse_mode: 'Markdown' }
        );

        // Send to User
        try {
            await ctx.telegram.sendMessage(userId, `🎧 *Admin javobi:* ${answer}`, { parse_mode: 'Markdown' });
            await ctx.editMessageText(`✅ Kanalga joylandi va foydalanuvchiga yuborildi.`);
        } catch (e) {
            await ctx.editMessageText(`⚠️ Kanalga joylandi, lekin foydalanuvchi botni bloklagan.`);
        }

        if (ticketService.updateStatus) await ticketService.updateStatus(ticketId, 'posted');
        await ctx.answerCbQuery("Kanalga post qilindi!");
    } catch (err) {
        console.error(err);
        await ctx.answerCbQuery("Kanalga yuborishda xatolik!");
    }
});

// 3. Disapprove
bot.action(/^disapprove_(\d+)$/, adminOnly, async (ctx) => {
    await ctx.editMessageText(`❌ Bekor qilindi.`);
    await ctx.answerCbQuery("Bekor qilindi");
});

bot.on('text', userMessageHandler);

module.exports = { bot };
