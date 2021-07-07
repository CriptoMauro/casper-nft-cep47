import { CasperClient, DeployUtil, Keys, RuntimeArgs, CLValueBuilder, CLValue, CLPublicKey, CLTypeBuilder } from "casper-js-sdk";
import * as utils from "./utils";

class CEP47Client {
  private contractHash: string;

  constructor(
    private nodeAddress: string,
    private chainName: string
  ) {}

  public async install(
    keys: Keys.AsymmetricKey,
    tokenName: string,
    tokenSymbol: string,
    tokenMeta: Map<string, string>,
    paymentAmount: string,
    wasm_path: string
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({
      token_name: CLValueBuilder.string(tokenName),
      token_symbol: CLValueBuilder.string(tokenSymbol),
      token_meta: toCLMap(tokenMeta)
    });

    const deployHash = await installWasmFile({
      chainName: this.chainName,
      paymentAmount: paymentAmount,
      nodeAddress: this.nodeAddress,
      keys: keys,
      pathToContract: wasm_path,
      runtimeArgs
    });

    if (deployHash !== null) {
      return deployHash;
    } else {
      throw Error('Problem with installation');
    }
  }

  public setContractHash(hash: string) {
    this.contractHash = hash;
  }

  public async totalSupply() {
    const stateRootHash = await utils.getStateRootHash(this.nodeAddress);
    const clValue = await utils.getContractData(
      this.nodeAddress, stateRootHash, this.contractHash, ["total_supply"]);

    if (clValue && clValue.CLValue instanceof CLValue) {
      return clValue.CLValue!.value().toString()
    } else {
      throw Error('Invalid stored value');
    }
  }

  public async mintOne(
    keys: Keys.AsymmetricKey, 
    recipient: CLPublicKey, 
    meta: Map<string, string>,
    paymentAmount: string
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({
      recipient: recipient,
      token_meta: toCLMap(meta),
    });

    const deployHash = await contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "mint_one",
      paymentAmount,
      nodeAddress: this.nodeAddress,
      keys: keys,
      runtimeArgs,
    });

    if (deployHash !== null) {
      return deployHash;
    } else {
      throw Error('Invalid Deploy');
    }
  }

  public async mintCopies(
    keys: Keys.AsymmetricKey, 
    recipient: CLPublicKey, 
    meta: Map<string, string>,
    count: number,
    paymentAmount: string
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({
      recipient: recipient,
      token_meta: toCLMap(meta),
      count: CLValueBuilder.u256(count)
    });

    const deployHash = await contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "mint_copies",
      paymentAmount,
      nodeAddress: this.nodeAddress,
      keys: keys,
      runtimeArgs,
    });

    if (deployHash !== null) {
      return deployHash;
    } else {
      throw Error('Invalid Deploy');
    }
  }
}


interface IInstallParams {
  nodeAddress: string;
  keys: Keys.AsymmetricKey;
  chainName: string,
  pathToContract: string,
  runtimeArgs: RuntimeArgs,
  paymentAmount: string,
}

const installWasmFile = async ({
  nodeAddress,
  keys,
  chainName,
  pathToContract,
  runtimeArgs,
  paymentAmount,
}: IInstallParams): Promise<string> => {
  const client = new CasperClient(nodeAddress);

  // Set contract installation deploy (unsigned).
  let deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      keys.publicKey,
      chainName,
    ),
    DeployUtil.ExecutableDeployItem.newModuleBytes(
      utils.getBinary(pathToContract),
      runtimeArgs
    ),
    DeployUtil.standardPayment(paymentAmount)
  );

  // Sign deploy.
  deploy = client.signDeploy(deploy, keys);

  // Dispatch deploy to node.
  return await client.putDeploy(deploy);
};

interface IContractCallParams {
  nodeAddress: string;
  keys: Keys.AsymmetricKey;
  chainName: string;
  entryPoint: string;
  runtimeArgs: RuntimeArgs;
  paymentAmount: string;
  contractHash: string;
}

const contractCall = async ({
  nodeAddress,
  keys,
  chainName,
  contractHash,
  entryPoint,
  runtimeArgs,
  paymentAmount
}: IContractCallParams) => {
  const client = new CasperClient(nodeAddress);
  const contractHashAsByteArray =  utils.contractHashToByteArray(contractHash);

  let deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      keys.publicKey,
      chainName,
    ),
    DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      contractHashAsByteArray,
      entryPoint,
      runtimeArgs
    ),
    DeployUtil.standardPayment(paymentAmount)
  );

  // Sign deploy.
  deploy = client.signDeploy(deploy, keys);

  // Dispatch deploy to node.
  const deployHash = await client.putDeploy(deploy);

  return deployHash;
};

const toCLMap = (map: Map<string, string>) => {
  let clMap = CLValueBuilder.map([CLTypeBuilder.string(), CLTypeBuilder.string()]);
  for (const [key, value] of Array.from(map.entries())) {
    clMap.set(CLValueBuilder.string(value[0]), CLValueBuilder.string(value[1]))
  }
  return clMap;
}

export default CEP47Client;
