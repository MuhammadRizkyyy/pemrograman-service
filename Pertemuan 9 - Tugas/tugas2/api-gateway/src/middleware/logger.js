const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Attach request ID to each request
const requestId = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Custom morgan token for request ID
morgan.token('request-id', (req) => req.id);
morgan.token('user-id', (req) => (req.user ? req.user.id : 'anonymous'));

const httpLogger = morgan(
  ':request-id :method :url :status :res[content-length] - :response-time ms [user::user-id]',
  {
    stream: {
      write: (message) => console.log(`[Gateway] ${message.trim()}`),
    },
  }
);

module.exports = { requestId, httpLogger };
