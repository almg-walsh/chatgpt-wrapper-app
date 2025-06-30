// convert-chatgpt-history.js
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('conversations.json', 'utf8'));

if (!Array.isArray(data) || data.length === 0) {
  console.error("No conversations found in the file.");
  process.exit(1);
}

let allMessages = [];

data.forEach(conversation => {
  let formatted = [];
  if (conversation.mapping) {
    formatted = Object.values(conversation.mapping)
      .filter(m => m.message && m.message.author && m.message.content)
      .map(m => ({
        role: m.message.author.role === 'assistant' ? 'assistant' : 'user',
        content: Array.isArray(m.message.content.parts)
          ? m.message.content.parts.join('\n')
          : (typeof m.message.content.text === 'string' ? m.message.content.text : ''),
      }));
  } else if (conversation.messages) {
    formatted = conversation.messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : (m.content?.parts?.join('\n') || ''),
    }));
  }
  allMessages = allMessages.concat(formatted);
});

fs.writeFileSync('openai-formatted-all.json', JSON.stringify(allMessages, null, 2));
console.log('Exported all conversations to openai-formatted-all.json');