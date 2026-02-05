
const { ethers } = require('ethers');

// Uniswap V2 Router Partial ABI
const routerAbi = [
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)',
    'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)',
    'function swapETHForExactTokens(uint amountOut, address[] path, address to, uint deadline)',
    'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline)',
    'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] path, address to, uint deadline)',
    'function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] path, address to, uint deadline)'
];

const iface = new ethers.Interface(routerAbi);

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');

async function run() {
    const hash = '0x1b761419ae046131a0c171f5c0cb5a197a2f0e018c1f05dbc677060ebb78fc79';
    console.log(`Fetching tx ${hash}...`);
    const tx = await provider.getTransaction(hash);
    
    console.log('To:', tx.to);
    console.log('Data:', tx.data);

    try {
        const decoded = iface.parseTransaction({ data: tx.data });
        console.log('Decoded Name:', decoded.name);
        console.log('Decoded Args:', decoded.args);
        console.log('Recipient (to):', decoded.args[3]); // usually 'to' is index 3 or 2 depending on func
    } catch (e) {
        console.log('Failed to decode:', e.message);
    }
}

run();
