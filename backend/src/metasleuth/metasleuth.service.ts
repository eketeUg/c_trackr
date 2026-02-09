/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class MetaSleuthService {
  private readonly logger = new Logger(MetaSleuthService.name);
  private readonly apiUrl = process.env.METASLEUTH_API_URL;

  async fetchTransactionFlow(
    transactionChain: string,
    transactionHash: string,
  ): Promise<any> {
    console.log(this.apiUrl);
    console.log(transactionChain);
    console.log(transactionHash);
    let chain;
    if (transactionChain === 'ethereum') {
      chain = 'eth';
    } else if (transactionChain === 'bnb') {
      chain = 'bsc';
    } else {
      chain = transactionChain;
    }

    const url = this.apiUrl;
    if (!url) {
      throw new Error('METASLEUTH_API_URL is not configured');
    }

    try {
      this.logger.log(
        `Fetching MetaSleuth flow for ${transactionHash} on ${transactionChain}`,
      );
      const response = await axios.post(
        url,
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          chain: chain,
          address: transactionHash,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'blocksec-token': process.env.METASLEUTH_TOKEN,
          },
        },
      );

      console.log(response.data);
      return response.data;
    } catch (error) {
      this.logger.error(`MetaSleuth API failed: ${error.message}`);
      if (error.response) {
        this.logger.error(
          `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`,
        );
      }
      return null;
    }
  }
}
