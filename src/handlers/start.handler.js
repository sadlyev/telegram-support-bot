const keyboards = require('../utils/keyboards');

module.exports = async (ctx) => {
  await ctx.reply(
    `Assalomu alaykum, ${ctx.from.first_name}! Qo‘llab-quvvatlash xizmatidan foydalanish uchun iltimos, telefon raqamingizni yuboring.`,
    keyboards.contactRequest()
  );
};
