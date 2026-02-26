import { LabelingService } from '../labeling/labeling.service';
import { MetaSleuthService } from '../metasleuth/metasleuth.service';
export declare class TransactionService {
    private readonly labelingService;
    private readonly metaSleuthService;
    private readonly logger;
    private providers;
    constructor(labelingService: LabelingService, metaSleuthService: MetaSleuthService);
    private readonly routerAbi;
    private readonly routerInterface;
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
    private computeLayout;
    private readonly knownTokens;
    private fetchTokenMetadata;
    private parseTokens;
    private addEdge;
    private getNativeSymbol;
}
