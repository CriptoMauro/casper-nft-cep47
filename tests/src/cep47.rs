use std::collections::BTreeMap;

use casper_engine_test_support::{Code, Hash, SessionBuilder, TestContext, TestContextBuilder};
use casper_types::{
    account::AccountHash, bytesrepr::FromBytes, runtime_args, AsymmetricType, CLTyped, PublicKey,
    RuntimeArgs, SecretKey, URef, U256, U512,
};

pub mod token_cfg {
    pub const NAME: &str = "CasperNFT";
    pub const SYMBOL: &str = "CNFT";
    pub const URI: &str = "https://casper.network/network";
    pub const LICENSE: &str = r#"MIT License

    Copyright (c) 2021 Casper Ecosystem
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE."#;

    pub const LOREM_IPSUM: &str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
}

pub const CASPERCEP47_CONTRACT: &str = "caspercep47_contract";
pub const CASPERCEP47_CONTRACT_HASH: &str = "caspercep47_contract_hash";

pub struct CasperCEP47Contract {
    pub context: TestContext,
    pub caspercep47_hash: Hash,
    pub admin: PublicKey,
    pub ali: PublicKey,
    pub bob: PublicKey,
}

pub type TokenId = String;
pub type URI = String;

impl CasperCEP47Contract {
    pub fn deploy() -> Self {
        let admin: PublicKey = SecretKey::ed25519_from_bytes([1u8; 32]).unwrap().into();
        let ali: PublicKey = SecretKey::ed25519_from_bytes([3u8; 32]).unwrap().into();
        let bob: PublicKey = SecretKey::ed25519_from_bytes([5u8; 32]).unwrap().into();
        let mut context = TestContextBuilder::new()
            .with_public_key(admin.clone(), U512::from(500_000_000_000_000_000u64))
            .with_public_key(ali.clone(), U512::from(500_000_000_000_000_000u64))
            .with_public_key(bob.clone(), U512::from(500_000_000_000_000_000u64))
            .build();
        let session_code = Code::from("dragons-nft.wasm");
        let meta: BTreeMap<String, String> = {
            let mut btree: BTreeMap<String, String> = BTreeMap::new();
            btree.insert("license".into(), token_cfg::LICENSE.into());
            btree
        };
        let session_args = runtime_args! {
            "token_name" => token_cfg::NAME,
            "token_symbol" => token_cfg::SYMBOL,
            "token_uri" => token_cfg::URI,
            "token_meta" => meta
        };
        let session = SessionBuilder::new(session_code, session_args)
            .with_address(admin.to_account_hash())
            .with_authorization_keys(&[admin.to_account_hash()])
            .build();
        context.run(session);
        let caspercep47_hash = context
            .query(
                admin.to_account_hash(),
                &[CASPERCEP47_CONTRACT_HASH.to_string()],
            )
            .unwrap()
            .into_t()
            .unwrap();

        Self {
            context,
            caspercep47_hash,
            admin: admin,
            ali: ali,
            bob: bob,
        }
    }

    fn call(&mut self, method: &str, args: RuntimeArgs) {
        let code = Code::Hash(self.caspercep47_hash, method.to_string());
        let session = SessionBuilder::new(code, args)
            .with_address(self.admin.to_account_hash())
            .with_authorization_keys(&[self.admin.to_account_hash()])
            .build();
        self.context.run(session);
    }

    fn query_contract<T: CLTyped + FromBytes>(&self, name: &str) -> Option<T> {
        match self.context.query(
            self.admin.to_account_hash(),
            &[CASPERCEP47_CONTRACT.to_string(), name.to_string()],
        ) {
            Err(_) => None,
            Ok(maybe_value) => {
                let value = maybe_value
                    .into_t()
                    .unwrap_or_else(|_| panic!("{} is not expected type.", name));
                Some(value)
            }
        }
    }

    pub fn name(&self) -> String {
        self.query_contract("name").unwrap()
    }

    pub fn symbol(&self) -> String {
        self.query_contract("symbol").unwrap()
    }

    pub fn uri(&self) -> URI {
        self.query_contract("uri").unwrap()
    }

    pub fn meta(&self) -> BTreeMap<String, String> {
        self.query_contract("meta").unwrap()
    }

    pub fn total_supply(&self) -> U256 {
        self.query_contract("total_supply").unwrap_or_default()
    }

    pub fn owner_of(&self, token_id: &TokenId) -> Option<PublicKey> {
        self.query_contract(owner_key(&token_id).as_str())
    }

    pub fn balance_of(&self, owner: PublicKey) -> U256 {
        self.query_contract(balance_key(&owner.to_account_hash()).as_str())
            .unwrap_or_default()
    }

    pub fn tokens(&self, owner: PublicKey) -> Vec<TokenId> {
        self.query_contract::<Vec<TokenId>>(token_key(&owner.to_account_hash()).as_str())
            .unwrap_or_default()
    }

    pub fn token_uri(&self, token_id: TokenId) -> Option<URI> {
        self.query_contract(uri_key(&token_id).as_str())
    }

    pub fn token_uref(&self, token_id: &TokenId) -> Option<URef> {
        self.query_contract(test_uref_key(&token_id).as_str())
    }

    pub fn set_meta(&mut self, new_meta: BTreeMap<String, String>) {
        self.call(
            "set_meta",
            runtime_args! {
                "new_meta" => new_meta,
            },
        );
    }

    pub fn mint_one(&mut self, recipient: PublicKey, token_uri: URI) {
        self.call(
            "mint_one",
            runtime_args! {
                "recipient" => recipient,
                "token_uri" => token_uri
            },
        );
    }

    pub fn mint_copies(&mut self, recipient: PublicKey, token_uri: URI, count: U256) {
        self.call(
            "mint_copies",
            runtime_args! {
                "recipient" => recipient,
                "token_uri" => token_uri,
                "count" => count
            },
        );
    }

    pub fn mint_many(&mut self, recipient: PublicKey, token_uris: Vec<URI>) {
        self.call(
            "mint_many",
            runtime_args! {
                "recipient" => recipient,
                "token_uris" => token_uris
            },
        );
    }

    pub fn transfer_token(&mut self, sender: PublicKey, recipient: PublicKey, token_id: TokenId) {
        self.call(
            "transfer_token",
            runtime_args! {
                "sender" => sender,
                "recipient" => recipient,
                "token_id" => token_id
            },
        );
    }

    pub fn transfer_many_tokens(
        &mut self,
        sender: PublicKey,
        recipient: PublicKey,
        token_ids: Vec<TokenId>,
    ) {
        self.call(
            "transfer_many_tokens",
            runtime_args! {
                "sender" => sender,
                "recipient" => recipient,
                "token_ids" => token_ids
            },
        );
    }

    pub fn transfer_all_tokens(&mut self, sender: PublicKey, recipient: PublicKey) {
        self.call(
            "transfer_all_tokens",
            runtime_args! {
                "sender" => sender,
                "recipient" => recipient
            },
        );
    }
}

fn balance_key(account: &AccountHash) -> String {
    format!("balances_{}", account)
}

fn owner_key(token_id: &TokenId) -> String {
    format!("owners_{}", token_id)
}

fn uri_key(token_id: &TokenId) -> String {
    format!("uris_{}", token_id)
}

fn token_key(account: &AccountHash) -> String {
    format!("tokens_{}", account)
}

fn test_uref_key(token_id: &TokenId) -> String {
    format!("turef_{}", token_id)
}
