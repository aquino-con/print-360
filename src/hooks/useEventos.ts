import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { DENTRO_TAURI } from "../api/cliente";

export const EVENTOS = {
  fila: "fila_atualizada",
  impressoras: "impressoras_atualizadas",
  alertas: "alertas_atualizados",
} as const;

/** Escuta eventos do backend Tauri; não faz nada no navegador. */
export function useEventos(evento: string, aoReceber: () => void) {
  const callback = useRef(aoReceber);
  callback.current = aoReceber;

  useEffect(() => {
    let remover: (() => void) | undefined;
    if (DENTRO_TAURI) {
      listen(evento, () => callback.current()).then((funcao) => {
        remover = funcao;
      });
    }
    return () => remover?.();
  }, [evento]);
}

/** Inscreve-se aos três eventos emitidos pelo coletor em segundo plano. */
export function useAtualizacoes(aoReceber: () => void) {
  useEventos(EVENTOS.fila, aoReceber);
  useEventos(EVENTOS.impressoras, aoReceber);
  useEventos(EVENTOS.alertas, aoReceber);
}
