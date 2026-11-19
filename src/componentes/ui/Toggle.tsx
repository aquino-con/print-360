interface Props {
  ativo: boolean;
  aoAlterar: (ativo: boolean) => void;
  rotulo: string;
  descricao?: string;
}

export function Toggle({ ativo, aoAlterar, rotulo, descricao }: Props) {
  return (
    <div className="flex align-center justify-between gap-4">
      <div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{rotulo}</div>
        {descricao && (
          <div style={{ fontSize: 10, color: "var(--cor-texto-claro)" }}>{descricao}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ativo}
        aria-label={rotulo}
        className={`toggle ${ativo ? "toggle--ativo" : ""}`}
        onClick={() => aoAlterar(!ativo)}
      >
        <span className="toggle__bolinha" />
      </button>
    </div>
  );
}
