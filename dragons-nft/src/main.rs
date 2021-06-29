#![no_main]

use std::collections::BTreeMap;

#[no_mangle]
pub extern "C" fn owner_of() {}

#[no_mangle]
pub extern "C" fn call() {
    let (contract_package_hash, _) =
        contract::contract_api::storage::create_contract_package_at_hash();
    let entry_points = cep47::get_entrypoints(None);
    cep47::deploy(
        &contract::contract_api::runtime::get_named_arg::<String>("token_name"),
        &contract::contract_api::runtime::get_named_arg::<String>("token_symbol"),
        &contract::contract_api::runtime::get_named_arg::<String>("token_uri"),
        contract::contract_api::runtime::get_named_arg::<BTreeMap<String, String>>("token_meta"),
        entry_points,
        contract_package_hash,
    );
}
