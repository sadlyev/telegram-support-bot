module.exports = async (ctx, next) => {
  const adminIdEnv = process.env.ADMIN_ID || "";
  
  // .map(id => id.trim()) is the key fix here!
  const adminIds = adminIdEnv.split(',').map(id => id.trim());

  if (adminIds.includes(ctx.from.id.toString())) {
    return next();
  }

  console.log(`[AUTH] Denied access to: ${ctx.from.id}. Allowed: ${adminIds}`);
  return ctx.reply("Access denied. Admins only.");
};
