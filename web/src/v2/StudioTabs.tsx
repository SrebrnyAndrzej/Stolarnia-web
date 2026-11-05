export function StudioTabs({
  id,
  label,
  value,
  onChange,
  items,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (id: string) => void;
  items: { id: string; label: string }[];
}) {
  return (
    <div className="fc-studio-tabs" role="tablist" aria-label={label}>
      {items.map((item, i) => (
        <button
          key={item.id}
          id={`${id}-tab-${item.id}`}
          role="tab"
          type="button"
          aria-selected={value === item.id}
          aria-controls={`${id}-panel-${item.id}`}
          tabIndex={value === item.id ? 0 : -1}
          onClick={() => onChange(item.id)}
          onKeyDown={(e) => {
            const next =
              e.key === "ArrowRight"
                ? (i + 1) % items.length
                : e.key === "ArrowLeft"
                  ? (i + items.length - 1) % items.length
                  : e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? items.length - 1
                      : null;
            if (next === null) return;
            e.preventDefault();
            onChange(items[next].id);
            document.getElementById(`${id}-tab-${items[next].id}`)?.focus();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
