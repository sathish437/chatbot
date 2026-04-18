const knowledge = require("../data/knowledge.json");

function getContext(userMsg) {
  const msg = userMsg.toLowerCase();

  const matches = knowledge.filter(item =>
    item.keywords.some(k => msg.includes(k))
  );

  return matches.map(m => m.content).join("\n") || null;
}

module.exports = getContext;
