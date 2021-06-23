#![no_main]

use casper_contract::contract_api::{runtime, storage};

#[no_mangle]
pub extern "C" fn owner_of() {}

#[no_mangle]
pub extern "C" fn call() {
    let (contract_package_hash, _) = storage::create_contract_package_at_hash();
    let entry_points = cep47::get_entrypoints(None);
    cep47::deploy(
        &runtime::get_named_arg::<String>("token_name"),
        &runtime::get_named_arg::<String>("token_symbol"),
        &runtime::get_named_arg::<String>("token_uri"),
        entry_points,
        contract_package_hash,
    );
}
