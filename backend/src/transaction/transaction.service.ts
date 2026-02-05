import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ethers } from 'ethers';
import { LabelingService } from '../labeling/labeling.service';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private providers: Record<string, ethers.JsonRpcProvider>;

  constructor(private readonly labelingService: LabelingService) {
    this.providers = {
      ethereum: new ethers.JsonRpcProvider('https://cloudflare-eth.com'),
      bnb: new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org'),
      base: new ethers.JsonRpcProvider('https://mainnet.base.org'),
      arbitrum: new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc'),
    };
  }

  async getTransactionFlow(chain: string, hash: string) {
    const provider = this.providers[chain.toLowerCase()];
    if (!provider) {
      throw new HttpException('Unsupported chain', HttpStatus.BAD_REQUEST);
    }

    try {
      const [tx, receipt] = await Promise.all([
        provider.getTransaction(hash),
        provider.getTransactionReceipt(hash),
      ]);

      if (!tx || !receipt) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      const nodes = new Map<string, any>();
      const edges: any[] = [];

      // Add Sender
      const senderLabel = await this.labelingService.getLabel(tx.from, provider);
      nodes.set(tx.from, { id: tx.from, label: senderLabel || 'Sender', type: 'wallet' });

      // Add Receiver
      const to = tx.to || ethers.ZeroAddress; // Contract creation if null
      const receiverLabel = await this.labelingService.getLabel(to, provider);
      nodes.set(to, { id: to, label: receiverLabel || 'Receiver', type: tx.to ? 'wallet' : 'contract' });

      // 1. Native Value Transfer
      if (tx.value > 0) {
        edges.push({
          source: tx.from,
          target: to,
          label: `${ethers.formatEther(tx.value)} ${this.getNativeSymbol(chain)}`,
          type: 'native',
        });
      }

      // 2. Parse Logs for ERC20 Transfers via helper
      // 2. Parse Logs for ERC20 Transfers via helper
      await this.parseTokens(receipt, nodes, edges, provider);

      const result = {
        nodes: Array.from(nodes.values()),
        edges,
        metadata: {
            hash: tx.hash,
            timestamp: (await tx.getBlock())?.date || new Date(), // Fallback if block is not found immediately
            blockNumber: tx.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: tx.gasPrice ? tx.gasPrice.toString() : '0',
            status: receipt.status === 1 ? 'Success' : 'Failed'
        }
      };

      this.logger.log(`Graph Data: ${JSON.stringify(result, null, 2)}`);

      return result;

    } catch (error) {
        this.logger.error(error);
        if (error instanceof HttpException) throw error;
        throw new HttpException('Failed to fetch transaction', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private readonly knownTokens: Record<string, { symbol: string, decimals: number }> = {
    '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18 },
    '0x833589fCd6eDb6E08f4c7C32D4f71b54bdA02913': { symbol: 'USDC', decimals: 6 },
    '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
    // Lowercase mappings handled in logic
  };

  private async fetchTokenMetadata(provider: ethers.JsonRpcProvider, address: string) {
    // Check known tokens
    const known = this.knownTokens[address.toLowerCase()] || 
                  Object.entries(this.knownTokens).find(([k]) => k.toLowerCase() === address.toLowerCase())?.[1];
    if (known) return known;

    try {
        const abi = [
            'function symbol() view returns (string)',
            'function name() view returns (string)',
            'function decimals() view returns (uint8)'
        ];
        // Use a generic provider call to avoid typed contract issues sometimes
        const contract = new ethers.Contract(address, abi, provider);
        
        const [symbol, decimals] = await Promise.all([
            contract.symbol().catch(async () => {
                // Fallback to name if symbol fails
                return await contract.name().catch(() => 'TOKEN');
            }),
            contract.decimals().catch(() => 18)
        ]);

        return { symbol, decimals: Number(decimals) };
    } catch (e) {
        return { symbol: 'ERC20', decimals: 18 };
    }
  }


  private async parseTokens(receipt: ethers.TransactionReceipt, nodes: Map<string, any>, edges: any[], provider: ethers.JsonRpcProvider) {
      const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      const depositTopic = '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c240225c50273805';
      const withdrawalTopic = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65';
      const erc1155Topic = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';
      
      const tokenCache = new Map<string, { symbol: string, decimals: number }>();
      
      this.logger.log(`Parsing ${receipt.logs.length} logs for tx ${receipt.hash}`);

      for (const log of receipt.logs) {
        try {
            const topic0 = log.topics[0]?.toLowerCase();
            const address = log.address.toLowerCase();
            const logAddressCheck = ethers.getAddress(log.address);

            // Ensure the contract emitting the event is visualized as a node
            if (!nodes.has(logAddressCheck)) {
                 const label = await this.labelingService.getLabel(logAddressCheck, provider);
                 nodes.set(logAddressCheck, { id: logAddressCheck, label: label || 'Contract (Interactor)', type: 'contract' });
            }

            // Helper to safely extract address
            const extractAddress = (topic: string) => ethers.getAddress(ethers.dataSlice(topic, 12));

            let token = tokenCache.get(address);
            if (!token) {
                token = await this.fetchTokenMetadata(provider, log.address);
                tokenCache.set(address, token);
            }

            let edgeAdded = false;

            // ERC20 Transfer
            if (topic0 === transferTopic && log.topics.length === 3) {
                const from = extractAddress(log.topics[1]);
                const toAddr = extractAddress(log.topics[2]);
                const value = BigInt(log.data);
                
                await this.addEdge(nodes, edges, from, toAddr, value, token, log.address, 'Token Transfer', log.index, provider);
                edgeAdded = true;
            }
            // ERC1155 TransferSingle
            else if (topic0 === erc1155Topic && log.topics.length === 4) {
                 const operator = extractAddress(log.topics[1]);
                 const from = extractAddress(log.topics[2]);
                 const toAddr = extractAddress(log.topics[3]);
                 await this.addEdge(nodes, edges, from, toAddr, BigInt(0), { symbol: 'NFT/1155', decimals: 0 }, log.address, 'NFT Transfer', log.index, provider);
                 edgeAdded = true;
            }
            // WETH Deposit
            else if (topic0 === depositTopic && log.topics.length === 2) {
                const dst = extractAddress(log.topics[1]);
                const wad = BigInt(log.data);
                await this.addEdge(nodes, edges, receipt.from, dst, wad, token, log.address, 'Wrap (Deposit)', log.index, provider);
                edgeAdded = true;
            }
            // WETH Withdrawal
            else if (topic0 === withdrawalTopic && log.topics.length === 2) {
                const src = extractAddress(log.topics[1]);
                const wad = BigInt(log.data);
                await this.addEdge(nodes, edges, src, log.address, wad, token, log.address, 'Unwrap (Withdrawal)', log.index, provider);
                edgeAdded = true;
            }
            
            // Fallback: Generic Interaction if no specific event matched
            if (!edgeAdded) {
                 // Removed to prevent noise: we only want to visualize actual value transfers
                 // await this.addEdge(nodes, edges, receipt.from, logAddressCheck, BigInt(0), { symbol: 'Interaction', decimals: 0 }, log.address, 'Contract Call', log.index);
            }

        } catch (e) {
            this.logger.error(`Failed to parse log ${log.index} at ${log.address}: ${e.message}`, e.stack);
        }
      }
  }

  private async addEdge(nodes: Map<string, any>, edges: any[], from: string, to: string, value: bigint, token: { symbol: string, decimals: number }, tokenAddress: string, typeLabel: string, index: number, provider?: ethers.JsonRpcProvider) {
        try {
            const cleanFrom = ethers.getAddress(from);
            const cleanTo = ethers.getAddress(to);

            if (!nodes.has(cleanFrom)) {
                nodes.set(cleanFrom, { id: cleanFrom, label: await this.labelingService.getLabel(cleanFrom, provider) || cleanFrom.slice(0,6)+'...', type: 'wallet' });
            }
            if (!nodes.has(cleanTo)) {
                nodes.set(cleanTo, { id: cleanTo, label: await this.labelingService.getLabel(cleanTo, provider) || cleanTo.slice(0,6)+'...', type: 'wallet' });
            }
            
            let formattedValue = "0";
            let displayLabel = "";

            if (token.symbol === 'Interaction') {
                displayLabel = "Contract Call";
            } else if (token.symbol === 'NFT/1155') {
                displayLabel = "NFT Transfer"; 
            } else {
                try {
                    formattedValue = ethers.formatUnits(value, token.decimals);
                } catch (err) {
                    this.logger.warn(`Format units failed for ${token.symbol}: ${err.message}. Defaulting to 18 dec.`);
                    formattedValue = ethers.formatUnits(value, 18);
                }
                displayLabel = `${parseFloat(formattedValue).toFixed(4)} ${token.symbol}`;
            }

            edges.push({
                source: cleanFrom,
                target: cleanTo,
                label: displayLabel, 
                tokenAddress: tokenAddress,
                type: 'token',
                logIndex: index
            });
        } catch (e) {
            this.logger.error(`Failed to add edge: ${e.message}`);
        }
  }

  private getNativeSymbol(chain: string): string {
    switch (chain.toLowerCase()) {
        case 'ethereum': return 'ETH';
        case 'bnb': return 'BNB';
        case 'base': return 'ETH';
        case 'arbitrum': return 'ETH';
        default: return 'ETH';
    }
  }
}
