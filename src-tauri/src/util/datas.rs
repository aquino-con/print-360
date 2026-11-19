/// Data/hora atual em ISO 8601, no fuso local.
pub fn agora_iso() -> String {
    chrono::Local::now().to_rfc3339()
}
