"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LabelingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelingService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
let LabelingService = LabelingService_1 = class LabelingService {
    logger = new common_1.Logger(LabelingService_1.name);
    async getLabel(address, provider) {
        const knownLabels = {
            '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': 'Uniswap V2 Router',
            '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD': 'Uniswap Universal Router',
            '0x0000000000000000000000000000000000000000': 'Null Address',
            '0xb92fe925dc43a0ecde6c8b1a2709c170ec4fff4f': 'RelayRouterV3',
            '0xea758cac6115309b325c582fd0782d79e3502177': 'BaseSettler',
            '0x498581ff718922c3f8e6a244956af099b2652b2b': 'PoolManager',
            '0xc8d077444625eb300a427a6dfb2b1dbf9b159040': 'ZoraV4CoinHook',
            '0x21e2ce70511e4fe542a97708e89520471daa7a66': 'SafeProxy',
            '0x7bf90111ad7c22bec9e9dff8a01a44713cc1b1b6': 'GnosisSafeProxy',
            '0x28C6c06298d514Db089934071355E5743bf21d60': 'Binance Hot Wallet 6',
            '0xdac17f958d2ee523a2206206994597c13d831ec7': 'Tether USD',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USD Coin',
            '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549': 'Binance Hot Wallet 7',
            '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503': 'Binance Hot Wallet 10',
        };
        const cleanAddress = address.toLowerCase();
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