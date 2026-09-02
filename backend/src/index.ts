import { createServer } from './server';
import { config } from './config';

const app = createServer();

app.listen(config.port, () => {
  console.log(`[GumShop Server] API listening on port ${config.port}`);
  console.log(`[GumShop Server] Health endpoint: http://localhost:${config.port}/api/health`);
  if (!config.isProduction) {
    console.log(`[Dev Notice] Default dev admin: ${config.adminEmail}`);
  }
});