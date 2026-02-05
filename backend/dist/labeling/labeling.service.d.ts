import { ethers } from 'ethers';
export declare class LabelingService {
    private readonly logger;
    getLabel(address: string, provider?: ethers.Provider | ethers.JsonRpcProvider): Promise<string | null>;
}
