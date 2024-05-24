delete require.cache[require.resolve('./config/secret')];
const secret = require('./config/secret');
console.log('Secret Config:', secret);

const expressApp = require('./config/express');
const { logger } = require('./config/winston');

const port = 3001;
expressApp.listen(port, () => {
  logger.info(`API Server Start At Port ${port}`);
});