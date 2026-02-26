
import { MetaSleuthService } from './src/metasleuth/metasleuth.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from .env file in backend root
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function run() {
  const service = new MetaSleuthService();
  const hash = '0x0821ae0fc3a7764e9052e77454afb1a98725c2c5846b5672f76f6f8a6880ff5e';
  const chain = 'base';

  console.log(`Testing MetaSleuth for ${hash} on ${chain}...`);
  try {
    const result = await service.fetchTransactionFlow(chain, hash);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
