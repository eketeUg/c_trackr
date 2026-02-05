import { LabelingService } from '../labeling/labeling.service';
export declare class TransactionService {
    private readonly labelingService;
    private readonly logger;
    private providers;
    constructor(labelingService: LabelingService);
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
    }>;
    private readonly knownTokens;
    private fetchTokenMetadata;
    private parseTokens;
    private addEdge;
    private getNativeSymbol;
}
