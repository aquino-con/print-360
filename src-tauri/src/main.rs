// Oculta o console no Windows em builds de releases.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    print_360_lib::run();
}
