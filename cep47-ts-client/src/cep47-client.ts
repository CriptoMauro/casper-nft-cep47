import { CasperClient, DeployUtil, Keys, RuntimeArgs, CLValueBuilder, CLValue, CLPublicKey } from "casper-js-sdk";
import * as constants from "./constants";
import contractCall from "./contract-call";
import installContract from "./install";
import * as utils from "./utils";

const CEP47_CONTRACT_NAME = "caspercep47_contract";

class CEP47Client {
  private contractHash: string;

  constructor(
    private nodeAddress: string,
    private keyPair: Keys.AsymmetricKey,
    public tokenName: string,
    public tokenSymbol: string,
    public tokenUri: string
  ) {}

  public async install() {
    const runtimeArgs = RuntimeArgs.fromMap({
      token_name: CLValueBuilder.string(this.tokenName),
      token_symbol: CLValueBuilder.string(this.tokenSymbol),
      token_uri: CLValueBuilder.string(this.tokenUri),
    });

    const deployHash = await installContract({
      chainName: constants.DEPLOY_CHAIN_NAME,
      gasPayment: constants.DEPLOY_GAS_PAYMENT,
      gasPrice: constants.DEPLOY_GAS_PRICE,
      nodeAddress: constants.NODE_ADDRESS,
      operatorKeyPair: this.keyPair,
      pathToContract: constants.PATH_TO_CONTRACT,
      runtimeArgs,
      ttl: constants.DEPLOY_TTL_MS,
    });

    console.log(deployHash);

    if (deployHash !== null) {
      await this.setCurrentContractHash();
      return { deployHash, contractHash: this.contractHash };
    } else {
      throw Error('Problem with installation');
    }
  }

  public async totalSupply() {
    const stateRootHash = await utils.getStateRootHash(this.nodeAddress);
    const clValue = await utils.getContractData(this.nodeAddress, stateRootHash, this.contractHash, [
      "total_supply",
    ]);


    if (clValue && clValue.CLValue instanceof CLValue) {
      return clValue.CLValue!.value().toString()
    } else {
      throw Error('Invalid stored value');
    }
  }

  public async mintOne(recipient: string, tokenUri: string) {
    const stateRootHash = await utils.getStateRootHash(this.nodeAddress);
    const runtimeArgs = RuntimeArgs.fromMap({
      recipient: CLPublicKey.fromHex(recipient),
      token_uri: CLValueBuilder.string(tokenUri),
    });

    const deployHash = await contractCall({
      chainName: constants.DEPLOY_CHAIN_NAME,
      contractHash: this.contractHash,
      entryPoint: "mint_one",
      gasPayment: constants.DEPLOY_GAS_PAYMENT,
      gasPrice: constants.DEPLOY_GAS_PRICE,
      nodeAddress: constants.NODE_ADDRESS,
      operatorKeyPair: this.keyPair,
      runtimeArgs,
      stateRootHash,
      ttl: constants.DEPLOY_TTL_MS,
    });

    if (deployHash !== null) {
    return { deployHash, stateRootHash, recipient };
    } else {
      throw Error('Invalid Deploy');
    }
  }

  private async setCurrentContractHash() {
    const stateRootHash = await utils.getStateRootHash(this.nodeAddress);
    const accountInfo = await utils.getAccountInfo(
      this.nodeAddress,
      stateRootHash,
      this.keyPair.publicKey
    );
    const contractHash = await utils.getAccountNamedKeyValue(
      accountInfo,
      CEP47_CONTRACT_NAME
    );
    this.contractHash = contractHash;
  }
}

export default CEP47Client;
