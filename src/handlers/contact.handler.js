const userService = require('../services/user.service');

module.exports = async (ctx) => {
  const { contact } = ctx.message;
  
  await userService.registerUser({
    id: ctx.from.id,
    first_name: ctx.from.first_name,
    phone_number: contact.phone_number
  });

  await ctx.reply("Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi! Endi savolingizni yo‘llashingiz mumkin.", { 
    reply_markup: { remove_keyboard: true } 
  });
};
