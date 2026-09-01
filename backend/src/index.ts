import { createServer } from './server';
import { config } from './config';

const app = createServer();

app.listen(config.port, () => {
  console.log(` ?  GumShop API Server running on port ${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/api/health`);
  console.log(`   Admin Login: admin@gumshop.online / admin123`);
});