const { Keys } = require("casper-js-sdk");
const { CEP47Client, utils } = require("cep47-ts-client");

const NODE_ADDRESS = 'http://3.143.158.19:7777/rpc';
// const NODE_ADDRESS = 'http://localhost:40101/rpc';
const INSTALL_PAYMENT_AMOUNT = '200000000000';
const MINT_ONE_PAYMENT_AMOUNT = '2000000000';
const MINT_COPIES_PAYMENT_AMOUNT = '100000000000';
const BURN_ONE_PAYMENT_AMOUNT = '2000000000';
const CHAIN_NAME = 'integration-test';
// const CHAIN_NAME = 'casper-net-1';
const WASM_PATH = "./../target/wasm32-unknown-unknown/release/dragons-nft.wasm";
const TOKEN_NAME = 'DragonsNFT';
const TOKEN_SYMBOL = 'DRAG';
const TOKEN_META = new Map([
    ['origin', 'fire'], 
    ['lifetime', 'infinite']
]);
const KEY_PAIR_PATH = '/home/ziel/workspace/casperlabs/day-3-keys';
const KEYS = Keys.Ed25519.parseKeyFiles(
    `${KEY_PAIR_PATH}/public_key.pem`,
    `${KEY_PAIR_PATH}/secret_key.pem`
);
const MINT_ONE_META_SIZE = 3;
const MINT_COPIES_META_SIZE = 10;
const MINT_COPIES_COUNT = 100;
const CONTRACT_HASH = 'ff1a2378a8c8e3b764417f44eaea2a4397699460d9cc5b6986a3099b3293f2ba';

const install = async () => {
    const cep47 = new CEP47Client(NODE_ADDRESS, CHAIN_NAME);
    const deployHash = await cep47.install(
      KEYS, TOKEN_NAME, TOKEN_SYMBOL, TOKEN_META, INSTALL_PAYMENT_AMOUNT, WASM_PATH);
    console.log(`Contract Installed`);
    console.log(`... DeployHash: ${deployHash}`);
};

const mintOne = async () => {
    const cep47 = new CEP47Client(NODE_ADDRESS, CHAIN_NAME);
    cep47.setContractHash(CONTRACT_HASH);
    let meta = randomMeta(MINT_ONE_META_SIZE);
    const deployHash = await cep47.mintOne(KEYS, KEYS.publicKey, meta, MINT_ONE_PAYMENT_AMOUNT);
    console.log(`Mint One`);
    console.log(`... DeployHash: ${deployHash}`);
}

const mintCopies = async () => {
    const cep47 = new CEP47Client(NODE_ADDRESS, CHAIN_NAME);
    cep47.setContractHash(CONTRACT_HASH);
    let meta = randomMeta(MINT_COPIES_META_SIZE);
    const deployHash = await cep47.mintCopies(
        KEYS, KEYS.publicKey, meta, MINT_COPIES_COUNT, MINT_COPIES_PAYMENT_AMOUNT);
    console.log(`Mint Copies`);
    console.log(`... DeployHash: ${deployHash}`);
}

const burnOne = async () => {
    const cep47 = new CEP47Client(NODE_ADDRESS, CHAIN_NAME);
    cep47.setContractHash(CONTRACT_HASH);
    const deployHash = await cep47.burnOne(KEYS, KEYS.publicKey, '1111', BURN_ONE_PAYMENT_AMOUNT);
    console.log(`Mint One`);
    console.log(`... DeployHash: ${deployHash}`);
}

const totalSupply = async () => {
    const cep47 = new CEP47Client(NODE_ADDRESS, CHAIN_NAME);
    cep47.setContractHash(CONTRACT_HASH);
    const totalSupply = await cep47.totalSupply();
    console.log(`Total Supply: ${totalSupply}`);
}

const balanceOf = async () => {
    const cep47 = new CEP47Client(NODE_ADDRESS, CHAIN_NAME);
    cep47.setContractHash(CONTRACT_HASH);
    const balance = await cep47.balanceOf(KEYS.publicKey);
    console.log(`Balance: ${balance}`);
}

const printAccount = async () => {
    let account = await utils.getAccountInfo(NODE_ADDRESS, KEYS.publicKey);
    console.log(account);
}

const randomMeta = (size) => {
    let data = []
    for (i = 0; i < size; i++) {
        data.push([`key${i}`, `value${i}`]);
    }
    return data;
}

const command = process.argv.slice(2)[0];

switch (command) {
    case 'install_contract':
        install();
        break;
    case 'mint_one':
        mintOne();
        break;
    case 'mint_copies':
        mintCopies();
        break;
    case 'burn_one':
        burnOne();
        break;
    case 'total_supply':
        totalSupply();
        break;
    case 'balance_of':
        balanceOf();
        break;
    case 'print_account':
        printAccount();
        break;
    default:
        console.log(`Command unknown ${command}`)
}
