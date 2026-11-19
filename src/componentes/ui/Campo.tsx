import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
}

export function Campo({ rotulo, id, ...resto }: CampoProps) {
  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor={id}>
        {rotulo}
      </label>
      <input id={id} className="campo__entrada" {...resto} />
    </div>
  );
}

interface SelecaoProps extends SelectHTMLAttributes<HTMLSelectElement> {
  rotulo: string;
  opcoes: string[];
}

export function Selecao({ rotulo, id, opcoes, ...resto }: SelecaoProps) {
  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor={id}>
        {rotulo}
      </label>
      <select id={id} className="campo__entrada" {...resto}>
        {opcoes.map((opcao) => (
          <option key={opcao}>{opcao}</option>
        ))}
      </select>
    </div>
  );
}
