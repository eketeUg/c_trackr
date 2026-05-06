import { TransactionService } from './transaction.service';
export declare class TransactionController {
    private readonly transactionService;
    constructor(transactionService: TransactionService);
    getTransactionFlow(chain: string, hash: string): Promise<{
        nodes: any[];
        edges: any[];
        metadata: {
            hash: string;
            timestamp: Date;
            blockNumber: number | null;
            gasUsed: string;
            gasPrice: string;
            status: string;
        };
    } | {
        nodes: any[];
        edges: any;
        metadata: {
            hash: string;
            timestamp: any;
            blockNumber: any;
            status: string;
        };
    }>;
    getAddressFlow(chain: string, address: string): Promise<{
        nodes: any;
        edges: any;
        metadata: {
            address: string;
            timestamp: any;
            status: string;
        };
    } | {
        nodes: never[];
        edges: never[];
        metadata: {
            address: string;
            status: string;
            timestamp?: undefined;
        };
    }>;
}
