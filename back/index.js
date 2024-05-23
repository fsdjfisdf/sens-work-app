const expressApp = require('./config/express');
const { logger } = require('./config/winston');

const port = 3001;
expressApp.listen(port, () => {
  logger.info(`API Server Start At Port ${port}`);
});
