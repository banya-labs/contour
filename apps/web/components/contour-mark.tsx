export function ContourMark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <img
      aria-hidden="true"
      src="/logo.svg"
      alt=""
      className={className}
      draggable={false}
    />
  );
}
