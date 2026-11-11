const mongoose = require('mongoose');
const config = require('./config');
const { createApp } = require('./app');

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');
  const app = createApp();
  app.listen(config.port, () => console.log(`Pulse API listening on http://localhost:${config.port}`));
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
