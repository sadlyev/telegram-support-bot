const express = require('express');
const app = express();

// Standard middleware
app.use(express.json());

// Health check route
app.get('/', (req, res) => res.send('Support Bot is Active!'));

module.exports = app;