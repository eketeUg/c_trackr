"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var LabelingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelingService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let LabelingService = LabelingService_1 = class LabelingService {
    logger = new common_1.Logger(LabelingService_1.name);
    externalLabels = {};
    async onModuleInit() {
        this.loadExternalLabels();
    }
    loadExternalLabels() {
        try {
            const filePath = path.join(__dirname, '../../src/data/known_labels_full.json');
            if (fs.existsSync(filePath)) {
                const rawData = fs.readFileSync(filePath, 'utf-8');
                const json = JSON.parse(rawData);
                for (const [address, data] of Object.entries(json)) {
                    if (typeof data === 'string') {
                        this.externalLabels[address.toLowerCase()] = data;
                    }
                    else if (data && data.name) {
                        this.externalLabels[address.toLowerCase()] = data.name;
                    }
                }
                this.logger.log(`Loaded ${Object.keys(this.externalLabels).length} external labels.`);
            }
            else {
                this.logger.warn(`Labels file not found at ${filePath}`);
            }
        }
        catch (e) {
            this.logger.error(`Failed to load external labels: ${e.message}`);
        }
    }
    async getLabel(address, provider) {
        const cleanAddress = address.toLowerCase();
        if (this.externalLabels[cleanAddress]) {
            return this.externalLabels[cleanAddress];
        }
        const knownLabels = {
            '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': 'Uniswap V2 Router',
            '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD': 'Uniswap Universal Router',
            '0xE592427A0AEce92De3Edee1F18E0157C05861564': 'Uniswap V3 Router',
            '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45': 'Uniswap V3 Router 2',
            '0x1F98431c8aD98523631AE4a59f267346ea31F984': 'Uniswap V3 Factory',
            '0x881D40237659C251811CEC9c364ef91dC08D300C': 'Metamask Swap Router',
            '0x1111111254fb6c44bAC0beD2854e76F90643097d': '1inch Aggregation Router V5',
            '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F': 'SushiSwap V2 Router',
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH (Wrapped Ether)',
            '0x0000000000000000000000000000000000000000': 'Null Address',
            '0xdac17f958d2ee523a2206206994597c13d831ec7': 'Tether USD',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USD Coin',
            '0x10ED43C718714eb63d5aA57B78B54704E256024E': 'PancakeSwap V2 Router',
            '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4': 'PancakeSwap V3 Router',
            '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': 'WBNB',
            '0x2626664c2603336E57B271c5C0b26F421741e481': 'Uniswap V3 Router (Base)',
            '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24': 'Uniswap V2 Router 2 (Base)',
            '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43': 'Aerodrome Router',
            '0x4200000000000000000000000000000000000006': 'WETH (Base)',
            '0x1b02dA8Cb0d097eB8D57A175b88c7D877664556F': 'SushiSwap V2 Router (Arb)',
            '0xc873fEcbd35458059Ve6C7f97288c7538b3bce32': 'Camelot Router',
            '0xb92fe925dc43a0ecde6c8b1a2709c170ec4fff4f': 'RelayRouterV3',
            '0xea758cac6115309b325c582fd0782d79e3502177': 'BaseSettler',
            '0x498581ff718922c3f8e6a244956af099b2652b2b': 'PoolManager',
            '0xc8d077444625eb300a427a6dfb2b1dbf9b159040': 'ZoraV4CoinHook',
            '0x21e2ce70511e4fe542a97708e89520471daa7a66': 'SafeProxy',
            '0x7bf90111ad7c22bec9e9dff8a01a44713cc1b1b6': 'GnosisSafeProxy',
            '0x28C6c06298d514Db089934071355E5743bf21d60': 'Binance Hot Wallet 6',
            '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549': 'Binance Hot Wallet 7',
            '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503': 'Binance Hot Wallet 10',
        };
        for (const [key, label] of Object.entries(knownLabels)) {
            if (key.toLowerCase() === cleanAddress)
                return label;
        }
        if (provider) {
            try {
                const abi = ['function name() view returns (string)'];
                const contract = new ethers_1.ethers.Contract(address, abi, provider);
                const name = await contract.name();
                if (name)
                    return name;
            }
            catch (e) {
            }
        }
        return null;
    }
};
exports.LabelingService = LabelingService;
exports.LabelingService = LabelingService = LabelingService_1 = __decorate([
    (0, common_1.Injectable)()
], LabelingService);
//# sourceMappingURL=labeling.service.js.map