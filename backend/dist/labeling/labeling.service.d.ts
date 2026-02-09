import { OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
export declare class LabelingService implements OnModuleInit {
    private readonly logger;
    private externalLabels;
    onModuleInit(): Promise<void>;
    private loadExternalLabels;
    getLabel(address: string, provider?: ethers.JsonRpcProvider): Promise<string | null>;
}
