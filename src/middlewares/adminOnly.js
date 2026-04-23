module.exports = async (ctx, next) => {
  const adminIdEnv = process.env.ADMIN_ID || "";
  
  // This cleans the string: splits by comma and removes any accidental spaces
  const adminIds = adminIdEnv.split(',').map(id => id.trim());

  if (adminIds.includes(ctx.from.id.toString())) {
    return next();
  }

  // Check Render Logs to see this line
  console.log(`[AUTH FAIL] User: ${ctx.from.id} | Allowed: ${JSON.stringify(adminIds)}`);
  
  return ctx.reply("Access denied. Admins only.");
};
