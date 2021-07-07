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
  return await client.putDeploy(deploy);
};

export default install;
