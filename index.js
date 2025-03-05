const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs').promises; 
const path = require('path');

const app = express();
const token = process.env.TELEGRAM_TOKEN; 
const botName = 'MathChatBot';


const storagePath = path.join('/data', 'userNames.json');


const bot = new TelegramBot(token);


app.use(express.json());


let userNames = {};
async function loadUserNames() {
  try {
    const data = await fs.readFile(storagePath, 'utf8');
    userNames = JSON.parse(data);
  } catch (error) {
    userNames = {}; 
  }
}


async function saveUserNames() {
  try {
    await fs.writeFile(storagePath, JSON.stringify(userNames, null, 2));
  } catch (error) {
    console.error('Error saving user names:', error);
  }
}


loadUserNames();


bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase();

  if (text === 'hi' || text === 'hello') {
    bot.sendMessage(chatId, `Hello! I’m ${botName}. How can I assist you today?`);
  } else if (text === 'how are you') {
    bot.sendMessage(chatId, 'I’m doing great, thanks! How about you?');
  }
});


bot.onText(/^solve (.+)/i, (msg, match) => {
  const chatId = msg.chat.id;
  const expression = match[1].replace(/\s/g, '');

  try {
    const result = eval(expression);
    if (isNaN(result) || !isFinite(result)) {
      throw new Error('Invalid result');
    }
    bot.sendMessage(chatId, `Result: ${result}`);
  } catch (error) {
    bot.sendMessage(chatId, 'Sorry, I couldn’t solve that. Use "solve <expression>" (e.g., "solve 123 + 456").');
  }
});


bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase();

  if (text.includes('your name') || text === 'what is your name') {
    bot.sendMessage(chatId, `I’m ${botName}! What’s your name?`);
  } else if (text.includes('my name is') || text.includes('i am')) {
    const userName = msg.text.match(/(?:my name is|i am)\s+(.+)/i)?.[1] || 'Friend';
    userNames[chatId] = userName;
    await saveUserNames(); 
    bot.sendMessage(chatId, `Nice to meet you, ${userName}! Shall we go to the math section? Use "solve <expression>" if you’d like.`);
  } else if (text === 'what is my name') {
    const userName = userNames[chatId] || 'Friend';
    bot.sendMessage(chatId, `Your name is ${userName}, right? Shall we go to the math section?`);
  }
});


bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text.match(/^solve .+/i) && 
      !['hi', 'hello', 'how are you'].includes(text.toLowerCase()) && 
      !text.includes('name') && 
      !text.includes('i am')) {
    bot.sendMessage(chatId, 'I can chat or solve math! Say "hi", ask my name, or use "solve <expression>" (e.g., "solve 123 + 456").');
  }
});


app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  const renderUrl = process.env.RENDER_EXTERNAL_URL || `https://your-app-name.onrender.com`;
  await bot.setWebHook(`${renderUrl}/webhook`);
});