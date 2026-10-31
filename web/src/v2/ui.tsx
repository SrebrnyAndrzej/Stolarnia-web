import type { ReactNode } from "react";

export function Logo() {
  return (
    <img
      className="ps-logo"
      src="/brand/pan-stolarz.png"
      width="3000"
      height="649"
      alt="Pan Stolarz — meble na wymiar"
    />
  );
}
export function Feedback({
  children,
  retry,
}: {
  children: ReactNode;
  retry?: () => void;
}) {
  return (
    <div className="ps-feedback" role="alert">
      <p>{children}</p>
      {retry && (
        <button className="ps-button secondary" onClick={retry}>
          Spróbuj ponownie
        </button>
      )}
    </div>
  );
}
