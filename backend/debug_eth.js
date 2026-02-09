
const { ethers } = require('ethers');

async function testRpc(url) {
    console.log(`Testing ${url}...`);
    try {
        const provider = new ethers.JsonRpcProvider(url);
        // Set a timeout
        const block = await Promise.race([
            provider.getBlockNumber(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        console.log(`Success! Block: ${block}`);
        return true;
    } catch (e) {
        console.log(`Failed: ${e.message}`);
        return false;
    }
}

async function run() {
    // New one
    await testRpc('https://rpc.flashbots.net');
}

run();
