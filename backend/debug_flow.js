
const { ethers } = require('ethers');

// Mock LabelingService
class LabelingService {
    async getLabel(address) {
        const knownLabels = {
            '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': 'Uniswap V2 Router',
            '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD': 'Uniswap Universal Router',
            '0xE592427A0AEce92De3Edee1F18E0157C05861564': 'Uniswap V3 Router',
            '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24': 'Uniswap V2 Router 2 (Base)',
            '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43': 'Aerodrome Router',
            '0x4200000000000000000000000000000000000006': 'WETH (Base)',
            // Add user's recently reported address just in case
        };
        return knownLabels[address] || null;
    }
}

// TransactionService core logic adapted for script
class TransactionService {
    constructor() {
        this.labelingService = new LabelingService();
        this.provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        this.knownTokens = {
             '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18 },
             '0x833589fCd6eDb6E08f4c7C32D4f71b54bdA02913': { symbol: 'USDC', decimals: 6 },
        };
    }

    async fetchTokenMetadata(address) {
        if (this.knownTokens[address.toLowerCase()]) return this.knownTokens[address.toLowerCase()];
        return { symbol: 'UNK', decimals: 18 }; 
    }

    async getTransactionFlow(hash) {
        console.log(`Fetching ${hash}...`);
        const [tx, receipt] = await Promise.all([
            this.provider.getTransaction(hash),
            this.provider.getTransactionReceipt(hash)
        ]);

        if (!tx || !receipt) throw new Error('Tx not found');

        const nodes = new Map();
        const edges = [];

        // Helper to add node
        const addNode = async (address, type) => {
            if (!nodes.has(address)) {
                let label = await this.labelingService.getLabel(address);
                if (!label) label = type === 'wallet' ? 'Wallet' : 'Contract'; 
                nodes.set(address, { id: address, label, type });
            }
        };
        
        // Add Sender/Receiver
        await addNode(tx.from, 'wallet');
        await addNode(tx.to || ethers.ZeroAddress, tx.to ? 'wallet' : 'contract');

        // Native Transfer
        if (tx.value > 0) {
            edges.push({ source: tx.from, target: tx.to, label: `${ethers.formatEther(tx.value)} ETH`, type: 'native' });
        }

        // Parse Logs
        const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        const depositTopic = '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c240225c50273805';
        const withdrawalTopic = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65';

        for (const log of receipt.logs) {
            try {
                const topic0 = log.topics[0]?.toLowerCase();
                const address = log.address;
                const logAddressCheck = ethers.getAddress(log.address);
                
                await addNode(logAddressCheck, 'contract');

                let token = await this.fetchTokenMetadata(logAddressCheck);
                
                const extractAddress = (t) => ethers.getAddress(ethers.dataSlice(t, 12));

                if (topic0 === transferTopic && log.topics.length === 3) {
                    const from = extractAddress(log.topics[1]);
                    const to = extractAddress(log.topics[2]);
                    const value = BigInt(log.data);
                    
                    await addNode(from, 'wallet');
                    await addNode(to, 'wallet');

                    edges.push({ source: from, target: to, label: `${ethers.formatUnits(value, token.decimals)} ${token.symbol}`, type: 'token' });
                }
                else if (topic0 === depositTopic && log.topics.length === 2) {
                    const wad = BigInt(log.data);
                    // Wrap: User -> Contract
                    edges.push({ source: tx.from, target: logAddressCheck, label: `Wrap ${ethers.formatUnits(wad, 18)} ETH`, type: 'token' });
                }
                else if (topic0 === withdrawalTopic && log.topics.length === 2) {
                    const src = extractAddress(log.topics[1]);
                    const wad = BigInt(log.data);
                    // Unwrap: Contract -> User
                    edges.push({ source: logAddressCheck, target: src, label: `Unwrap ${ethers.formatUnits(wad, 18)} WETH`, type: 'token' });
                }

            } catch (e) {
                console.error(e);
            }
        }

        return { nodes: Array.from(nodes.values()), edges };
    }
}

async function run() {
    const service = new TransactionService();
    // 0x1b761419ae046131a0c171f5c0cb5a197a2f0e018c1f05dbc677060ebb78fc79
    const data = await service.getTransactionFlow('0x1b761419ae046131a0c171f5c0cb5a197a2f0e018c1f05dbc677060ebb78fc79');
    console.log(JSON.stringify(data, null, 2));
}

run();
