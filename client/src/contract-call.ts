import { CasperClient, DeployUtil, Keys, RuntimeArgs } from "casper-js-sdk";
import * as utils from "./utils";

interface IContractCallParams {
  nodeAddress: string;
  operatorKeyPair: Keys.AsymmetricKey;
  chainName: string;
  gasPrice: number;
  ttl: number;
  entryPoint: string;
  runtimeArgs: RuntimeArgs;
  gasPayment: number;
  stateRootHash: string;
  contractHash: string;
}

const contractCall = async ({
  nodeAddress,
  operatorKeyPair,
  stateRootHash,
  contractHash,
  chainName,
  gasPayment,
  gasPrice,
  ttl,
  entryPoint,
  runtimeArgs,
}: IContractCallParams) => {
  const client = new CasperClient(nodeAddress);
  const contractHashAsByteArray =  utils.contractHashToByteArray(contractHash);

  let deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      operatorKeyPair.publicKey,
      chainName,
      gasPrice,
      ttl
    ),
    DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      contractHashAsByteArray,
      entryPoint,
      runtimeArgs
    ),
    DeployUtil.standardPayment(gasPayment)
  );

  // Sign deploy.
  deploy = client.signDeploy(deploy, operatorKeyPair);

  // Dispatch deploy to node.
  const deployHash = await client.putDeploy(deploy);

  return deployHash;
};

export default contractCall;
