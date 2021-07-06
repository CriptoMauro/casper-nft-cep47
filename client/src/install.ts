import {
  CasperClient,
  DeployUtil,
  Keys,
  RuntimeArgs,
} from "casper-js-sdk";
import * as constants from "./constants";
import * as utils from "./utils";

interface IInstallParams {
  nodeAddress: string;
  operatorKeyPair: Keys.AsymmetricKey;
  chainName: string,
  gasPrice: number,
  ttl: number,
  pathToContract: string,
  runtimeArgs: RuntimeArgs,
  gasPayment: number,
}

const install = async ({
  nodeAddress,
  operatorKeyPair,
  chainName,
  gasPayment,
  gasPrice,
  ttl,
  pathToContract,
  runtimeArgs,
}: IInstallParams) => {
  const client = new CasperClient(nodeAddress);

  // Set contract installation deploy (unsigned).
  let deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      operatorKeyPair.publicKey,
      chainName,
      gasPrice,
      ttl
    ),
    DeployUtil.ExecutableDeployItem.newModuleBytes(
      utils.getBinary(pathToContract),
      runtimeArgs
    ),
    DeployUtil.standardPayment(gasPayment)
  );

  // Sign deploy.
  deploy = client.signDeploy(deploy, operatorKeyPair);

  // Dispatch deploy to node.
  const deployHash = await client.putDeploy(deploy);

  // Render deploy details.
  logDetails(deployHash);
};

/**
 * Emits to stdout deploy details.
 * @param {String} deployHash - Identifer of dispatched deploy.
 */
const logDetails = (deployHash: string) => {
  console.log(`
---------------------------------------------------------------------
installed contract -> CEP47
... account = ${constants.PATH_TO_FAUCET_ACCOUNT}
... deploy chain = ${constants.DEPLOY_CHAIN_NAME}
... deploy dispatch node = ${constants.NODE_ADDRESS}
... deploy gas payment = ${constants.DEPLOY_GAS_PAYMENT}
... deploy gas price = ${constants.DEPLOY_GAS_PRICE}
contract constructor args:
contract installation details:
... path = ${constants.PATH_TO_CONTRACT}
... deploy hash = ${deployHash}
---------------------------------------------------------------------
    `);
};

export default install;
