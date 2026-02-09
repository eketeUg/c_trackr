"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TransactionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const labeling_service_1 = require("../labeling/labeling.service");
let TransactionService = TransactionService_1 = class TransactionService {
    labelingService;
    logger = new common_1.Logger(TransactionService_1.name);
    providers;
    constructor(labelingService) {
        this.labelingService = labelingService;
        this.providers = {
            ethereum: new ethers_1.ethers.JsonRpcProvider('https://rpc.flashbots.net'),
            bnb: new ethers_1.ethers.JsonRpcProvider('https://bsc-dataseed.binance.org'),
            base: new ethers_1.ethers.JsonRpcProvider('https://mainnet.base.org'),
            arbitrum: new ethers_1.ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc'),
        };
    }
    routerAbi = [
        'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)',
        'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)',
        'function swapETHForExactTokens(uint amountOut, address[] path, address to, uint deadline)',
        'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline)',
        'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] path, address to, uint deadline)',
        'function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] path, address to, uint deadline)'
    ];
    routerInterface = new ethers_1.ethers.Interface(this.routerAbi);
    async getTransactionFlow(chain, hash) {
        const provider = this.providers[chain.toLowerCase()];
        if (!provider) {
            throw new common_1.HttpException('Unsupported chain', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const [tx, receipt] = await Promise.all([
                provider.getTransaction(hash),
                provider.getTransactionReceipt(hash),
            ]);
            if (!tx || !receipt) {
                throw new common_1.HttpException('Transaction not found', common_1.HttpStatus.NOT_FOUND);
            }
            const nodes = new Map();
            const edges = [];
            const senderLabel = await this.labelingService.getLabel(tx.from, provider);
            nodes.set(tx.from, { id: tx.from, label: senderLabel || 'Sender', type: 'wallet' });
            const to = tx.to || ethers_1.ethers.ZeroAddress;
            const receiverLabel = await this.labelingService.getLabel(to, provider);
            nodes.set(to, { id: to, label: receiverLabel || 'Receiver', type: tx.to ? 'wallet' : 'contract' });
            if (tx.value > 0) {
                edges.push({
                    source: tx.from,
                    target: to,
                    label: `${ethers_1.ethers.formatEther(tx.value)} ${this.getNativeSymbol(chain)}`,
                    type: 'native',
                });
            }
            let decodedRecipient = null;
            try {
                const decoded = this.routerInterface.parseTransaction({ data: tx.data });
                if (decoded && decoded.args) {
                    if (decoded.args.to) {
                        decodedRecipient = decoded.args.to;
                    }
                    else {
                        if (typeof decoded.args[3] === 'string' && ethers_1.ethers.isAddress(decoded.args[3])) {
                            decodedRecipient = decoded.args[3];
                        }
                        else if (typeof decoded.args[2] === 'string' && ethers_1.ethers.isAddress(decoded.args[2])) {
                            decodedRecipient = decoded.args[2];
                        }
                    }
                }
            }
            catch (e) {
            }
            await this.parseTokens(receipt, nodes, edges, provider, to, decodedRecipient);
            const result = {
                nodes: Array.from(nodes.values()),
                edges,
                metadata: {
                    hash: tx.hash,
                    timestamp: (await tx.getBlock())?.date || new Date(),
                    blockNumber: tx.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    gasPrice: tx.gasPrice ? tx.gasPrice.toString() : '0',
                    status: receipt.status === 1 ? 'Success' : 'Failed'
                }
            };
            this.logger.log(`Graph Data: ${JSON.stringify(result, null, 2)}`);
            return result;
        }
        catch (error) {
            this.logger.error(error);
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException('Failed to fetch transaction', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    knownTokens = {
        '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18 },
        '0x833589fCd6eDb6E08f4c7C32D4f71b54bdA02913': { symbol: 'USDC', decimals: 6 },
        '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
    };
    async fetchTokenMetadata(provider, address) {
        const known = this.knownTokens[address.toLowerCase()] ||
            Object.entries(this.knownTokens).find(([k]) => k.toLowerCase() === address.toLowerCase())?.[1];
        if (known)
            return known;
        try {
            const abi = [
                'function symbol() view returns (string)',
                'function name() view returns (string)',
                'function decimals() view returns (uint8)'
            ];
            const contract = new ethers_1.ethers.Contract(address, abi, provider);
            const [symbol, decimals] = await Promise.all([
                contract.symbol().catch(async () => {
                    return await contract.name().catch(() => 'TOKEN');
                }),
                contract.decimals().catch(() => 18)
            ]);
            return { symbol, decimals: Number(decimals) };
        }
        catch (e) {
            return { symbol: 'ERC20', decimals: 18 };
        }
    }
    async parseTokens(receipt, nodes, edges, provider, txTo, decodedRecipient) {
        const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        const depositTopic = '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c240225c50273805';
        const withdrawalTopic = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65';
        const erc1155Topic = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';
        const tokenCache = new Map();
        this.logger.log(`Parsing ${receipt.logs.length} logs for tx ${receipt.hash}`);
        for (const log of receipt.logs) {
            try {
                const topic0 = log.topics[0]?.toLowerCase();
                const address = log.address.toLowerCase();
                const logAddressCheck = ethers_1.ethers.getAddress(log.address);
                if (!nodes.has(logAddressCheck)) {
                    let label = await this.labelingService.getLabel(logAddressCheck, provider);
                    if (!label) {
                        const token = await this.fetchTokenMetadata(provider, log.address);
                        if (token && token.symbol !== 'UNK') {
                            label = `${token.symbol} Token`;
                        }
                        else {
                            label = 'Contract (Interactor)';
                        }
                    }
                    nodes.set(logAddressCheck, { id: logAddressCheck, label: label, type: 'contract' });
                }
                const extractAddress = (topic) => ethers_1.ethers.getAddress(ethers_1.ethers.dataSlice(topic, 12));
                let token = tokenCache.get(address);
                if (!token) {
                    token = await this.fetchTokenMetadata(provider, log.address);
                    tokenCache.set(address, token);
                }
                let edgeAdded = false;
                if (topic0 === transferTopic && log.topics.length === 3) {
                    const from = extractAddress(log.topics[1]);
                    const toAddr = extractAddress(log.topics[2]);
                    const value = BigInt(log.data);
                    await this.addEdge(nodes, edges, from, toAddr, value, token, log.address, 'Token Transfer', log.index, provider);
                    edgeAdded = true;
                }
                else if (topic0 === erc1155Topic && log.topics.length === 4) {
                    const operator = extractAddress(log.topics[1]);
                    const from = extractAddress(log.topics[2]);
                    const toAddr = extractAddress(log.topics[3]);
                    await this.addEdge(nodes, edges, from, toAddr, BigInt(0), { symbol: 'NFT/1155', decimals: 0 }, log.address, 'NFT Transfer', log.index, provider);
                    edgeAdded = true;
                }
                else if (topic0 === depositTopic && log.topics.length === 2) {
                    const dst = extractAddress(log.topics[1]);
                    const wad = BigInt(log.data);
                    await this.addEdge(nodes, edges, dst, log.address, wad, token, log.address, 'Wrap', log.index, provider);
                    edgeAdded = true;
                }
                else if (topic0 === withdrawalTopic && log.topics.length === 2) {
                    const src = extractAddress(log.topics[1]);
                    const wad = BigInt(log.data);
                    await this.addEdge(nodes, edges, log.address, src, wad, token, log.address, 'Unwrap', log.index, provider);
                    edgeAdded = true;
                    if (decodedRecipient && src.toLowerCase() === txTo.toLowerCase()) {
                        const ethToken = { symbol: this.getNativeSymbol('base'), decimals: 18 };
                        await this.addEdge(nodes, edges, src, decodedRecipient, wad, ethToken, ethers_1.ethers.ZeroAddress, 'ETH Transfer', log.index + 0.1, provider);
                    }
                }
                if (!edgeAdded) {
                }
            }
            catch (e) {
                this.logger.error(`Failed to parse log ${log.index} at ${log.address}: ${e.message}`, e.stack);
            }
        }
    }
    async addEdge(nodes, edges, from, to, value, token, tokenAddress, typeLabel, index, provider) {
        try {
            const cleanFrom = ethers_1.ethers.getAddress(from);
            const cleanTo = ethers_1.ethers.getAddress(to);
            if (!nodes.has(cleanFrom)) {
                nodes.set(cleanFrom, { id: cleanFrom, label: await this.labelingService.getLabel(cleanFrom, provider) || cleanFrom.slice(0, 6) + '...', type: 'wallet' });
            }
            if (!nodes.has(cleanTo)) {
                nodes.set(cleanTo, { id: cleanTo, label: await this.labelingService.getLabel(cleanTo, provider) || cleanTo.slice(0, 6) + '...', type: 'wallet' });
            }
            let formattedValue = "0";
            let displayLabel = "";
            if (token.symbol === 'Interaction') {
                displayLabel = "Contract Call";
            }
            else if (token.symbol === 'NFT/1155') {
                displayLabel = "NFT Transfer";
            }
            else {
                try {
                    formattedValue = ethers_1.ethers.formatUnits(value, token.decimals);
                }
                catch (err) {
                    this.logger.warn(`Format units failed for ${token.symbol}: ${err.message}. Defaulting to 18 dec.`);
                    formattedValue = ethers_1.ethers.formatUnits(value, 18);
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
        }
        catch (e) {
            this.logger.error(`Failed to add edge: ${e.message}`);
        }
    }
    getNativeSymbol(chain) {
        switch (chain.toLowerCase()) {
            case 'ethereum': return 'ETH';
            case 'bnb': return 'BNB';
            case 'base': return 'ETH';
            case 'arbitrum': return 'ETH';
            default: return 'ETH';
        }
    }
};
exports.TransactionService = TransactionService;
exports.TransactionService = TransactionService = TransactionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [labeling_service_1.LabelingService])
], TransactionService);
//# sourceMappingURL=transaction.service.js.map