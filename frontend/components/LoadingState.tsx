type Props = { message?: string };

export function LoadingState({ message = "Carregando…" }: Props) {
  return (
    <div className="loading-state">
      <div className="loading-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
