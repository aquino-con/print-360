pub mod coletor;
pub mod rede;
pub mod spooler;
pub mod util;

#[cfg(target_os = "windows")]
mod spooler_windows;
#[cfg(not(target_os = "windows"))]
mod spooler_cups;
