const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

app.use(express.static(__dirname));

const amoCRMProxy = createProxyMiddleware({
  target: 'https://maksbulavsky.amocrm.ru/api/v4/leads',
  changeOrigin: true,
  logLevel: 'debug',
  pathRewrite: {'^/api' : ''},
});

app.use('/api', amoCRMProxy);

const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
