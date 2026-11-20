use std::{
    net::{IpAddr, Ipv4Addr, SocketAddr, TcpStream},
    time::Duration,
};

use crate::erro::AppResult;

use super::spooler::ImpressoraSistema;

const TIMEOUT_MS: u64 = 150;
const MAX_ALVOS: usize = 512;
const PORTAS: [u16; 2] = [631, 9100]; // IPP e impressão direta (RAW)

/// Expande uma lista de IPs ou blocos CIDR IPv4 em endereços individuais.
fn expandir_alvos(alvos: &str) -> Vec<Ipv4Addr> {
    let mut resultado = Vec::new();
    for parte in alvos.split(|c: char| c == ',' || c == ';' || c == ' ' || c == '\n') {
        let parte = parte.trim();
        if parte.is_empty() {
            continue;
        }
        match parte.split_once('/') {
            None => {
                if let Ok(ip) = parte.parse::<Ipv4Addr>() {
                    resultado.push(ip);
                }
            }
            Some((base, bits)) => {
                let Ok(ip) = base.parse::<Ipv4Addr>() else { continue };
                let Ok(prefixo) = bits.parse::<u8>() else { continue };
                if !(8..=32).contains(&prefixo) {
                    continue;
                }
                let tamanho = 1u64 << (32 - prefixo as u32);
                if tamanho > MAX_ALVOS as u64 {
                    continue; // evite varreduras amplas não intencionais
                }
                let mascara = if prefixo == 32 { 0 } else { u32::MAX << (32 - prefixo) };
                let inicio = u32::from(ip) & mascara;
                for deslocamento in 0..tamanho {
                    resultado.push(Ipv4Addr::from(inicio + deslocamento as u32));
                }
            }
        }
    }
    resultado.sort();
    resultado.dedup();
    resultado.truncate(MAX_ALVOS);
    resultado
}

fn sonda(ip: Ipv4Addr) -> Option<ImpressoraSistema> {
    for porta in PORTAS {
        let endereco = SocketAddr::new(IpAddr::V4(ip), porta);
        if TcpStream::connect_timeout(&endereco, Duration::from_millis(TIMEOUT_MS)).is_ok() {
            return Some(ImpressoraSistema {
                nome: format!("Rede {}", ip),
                modelo: Some("Descoberta em rede".into()),
                endereco: Some(ip.to_string()),
                status: "pronta".into(),
                compartilhada: true,
            });
        }
    }
    None
}

/// Descobre impressoras na rede somente nos alvos explicitamente configurados.
pub fn descobrir(alvos: &str) -> AppResult<Vec<ImpressoraSistema>> {
    let alvos = expandir_alvos(alvos);
    let mut encontradas = Vec::new();

    for grupo in alvos.chunks(16) {
        std::thread::scope(|escopo| {
            let manipuladores: Vec<_> = grupo
                .iter()
                .map(|ip| escopo.spawn(move || sonda(*ip)))
                .collect();
            let mut locais = Vec::new();
            for manipulador in manipuladores {
                if let Ok(Some(impressora)) = manipulador.join() {
                    locais.push(impressora);
                }
            }
            encontradas.extend(locais);
        });
    }
    Ok(encontradas)
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn expande_ip_e_cidr_com_limite() {
        let ips = expandir_alvos("192.0.2.10, 198.51.100.0/30");
        assert_eq!(ips.len(), 5);
        assert!(ips.contains(&Ipv4Addr::new(192, 0, 2, 10)));
        assert!(ips.contains(&Ipv4Addr::new(198, 51, 100, 3)));

        let amplo = expandir_alvos("203.0.113.0/8");
        assert!(amplo.is_empty()); // intervalo muito amplo é rejeitado
    }
}
