// import { CLPublicKey, CLValueBuilder, RuntimeArgs } from "casper-js-sdk";
import CEP47Client from "./cep47-client";
// import * as constants from "./constants";
// import contractCall from "./contract-call";
// import installContract from "./install";
// import * as utils from "./utils";


// const operatorKeyPair = utils.getKeyPairOfContract(
//   constants.PATH_TO_FAUCET_ACCOUNT
// );

// const run = async () => {
//   const cep47 = new Cep47(
//     constants.NODE_ADDRESS,
//     operatorKeyPair,
//     constants.TOKEN_NAME,
//     constants.TOKEN_SYMBOL,
//     constants.TOKEN_URI
//   );
//   const installed = await cep47.install();

//   if (installed) {
//     console.log(`Contract Installed`);
//     console.log(`... DeployHash: ${installed.deployHash}`);
//     console.log(`... ContractHash: ${installed.contractHash}`);
//   }

//   let ts = await cep47.totalSupply();
//   console.log("Total Supply ", ts);

//   const mintOne = await cep47.mintOne(
//     "0104dc5a6af3612e3de9045fb7c2624b3ab9c2333434c0a6a228014747d0fa5203",
//     constants.TOKEN_URI
//   );

//   if (mintOne) {
//     console.log(`Contract Call - mint_one`);
//     console.log(`... DeployHash: ${mintOne.deployHash}`);
//     console.log(`... Recipient Address: ${mintOne.recipient}`);
//   }

//   await utils.sleep(1000 * 5);

//   ts = await cep47.totalSupply();
//   console.log("Total Supply ", ts);
// };

// run();

export default CEP47Client;
