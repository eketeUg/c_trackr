"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MetaSleuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaSleuthService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let MetaSleuthService = MetaSleuthService_1 = class MetaSleuthService {
    logger = new common_1.Logger(MetaSleuthService_1.name);
    apiUrl = process.env.METASLEUTH_API_URL;
    async fetchTransactionFlow(transactionChain, transactionHash) {
        console.log(this.apiUrl);
        console.log(transactionChain);
        console.log(transactionHash);
        let chain;
        if (transactionChain === 'ethereum') {
            chain = 'eth';
        }
        else if (transactionChain === 'bnb') {
            chain = 'bsc';
        }
        else {
            chain = transactionChain;
        }
        const url = this.apiUrl;
        if (!url) {
            throw new Error('METASLEUTH_API_URL is not configured');
        }
        try {
            this.logger.log(`Fetching MetaSleuth flow for ${transactionHash} on ${transactionChain}`);
            const response = await axios_1.default.post(url, {
                chain: chain,
                address: transactionHash,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'blocksec-token': process.env.METASLEUTH_TOKEN,
                },
            });
            console.log(response.data);
            return response.data;
        }
        catch (error) {
            this.logger.error(`MetaSleuth API failed: ${error.message}`);
            if (error.response) {
                this.logger.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
            }
            return null;
        }
    }
};
exports.MetaSleuthService = MetaSleuthService;
exports.MetaSleuthService = MetaSleuthService = MetaSleuthService_1 = __decorate([
    (0, common_1.Injectable)()
], MetaSleuthService);
//# sourceMappingURL=metasleuth.service.js.map