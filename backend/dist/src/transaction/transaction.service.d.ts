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
    private computeLayout;
    private readonly knownTokens;
    private fetchTokenMetadata;
    private parseTokens;
    private addEdge;
    private getNativeSymbol;
}
