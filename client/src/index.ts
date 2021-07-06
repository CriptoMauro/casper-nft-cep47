import { CLValueBuilder, CLPublicKey, RuntimeArgs } from "casper-js-sdk";
import * as constants from "./constants";
import installContract from "./install";
import contractCall from "./contract-call";
import * as utils from "./utils";

const operatorKeyPair = utils.getKeyPairOfContract(
  constants.PATH_TO_FAUCET_ACCOUNT
);

// const runtimeArgs = RuntimeArgs.fromMap({
//   token_name: CLValueBuilder.string(constants.TOKEN_NAME),
//   token_symbol: CLValueBuilder.string(constants.TOKEN_SYMBOL),
//   token_uri: CLValueBuilder.string(constants.TOKEN_URI),
// });

// const hash = installContract({
//   chainName: constants.DEPLOY_CHAIN_NAME,
//   gasPayment: constants.DEPLOY_GAS_PAYMENT,
//   gasPrice: constants.DEPLOY_GAS_PRICE,
//   nodeAddress: constants.NODE_ADDRESS,
//   operatorKeyPair,
//   pathToContract: constants.PATH_TO_CONTRACT,
//   runtimeArgs,
//   ttl: constants.DEPLOY_TTL_MS,
// });


const run = async () => {
  let stateRootHash = await utils.getStateRootHash(constants.NODE_ADDRESS);
  const accountInfo = await utils.getAccountInfo(
    constants.NODE_ADDRESS,
    stateRootHash,
    operatorKeyPair.publicKey
  );
  const contractHash = utils.getAccountNamedKeyValue(
    accountInfo,
    "caspercep47_contract"
  );

  const runtimeArgs = RuntimeArgs.fromMap({
    recepient: CLPublicKey.fromHex('0104dc5a6af3612e3de9045fb7c2624b3ab9c2333434c0a6a228014747d0fa5203'),
    token_uri: CLValueBuilder.string('blabla'),
  });

  // recepientAddress: "0202409d7f6fc78f214120b05f559033be915aadd1da2a423fd08540b7d3ced2cb0c",
  // amountToTransfer: 2000000000,
  const deployHash = await contractCall({
    chainName: constants.DEPLOY_CHAIN_NAME,
    contractHash,
    entryPoint: "mint_one",
    gasPayment: constants.DEPLOY_GAS_PAYMENT,
    gasPrice: constants.DEPLOY_GAS_PRICE,
    nodeAddress: constants.NODE_ADDRESS,
    operatorKeyPair,
    runtimeArgs,
    stateRootHash,
    ttl: constants.DEPLOY_TTL_MS,
  });

  const recepientAccountHash = CLPublicKey.fromHex('0104dc5a6af3612e3de9045fb7c2624b3ab9c2333434c0a6a228014747d0fa5203').toAccountHashStr()
  stateRootHash = await utils.getStateRootHash(constants.NODE_ADDRESS);
  console.log('stateRootHash', stateRootHash);
  console.log('recepientAccountHash ', recepientAccountHash);
  console.log('deployHash', deployHash);
};
run();
