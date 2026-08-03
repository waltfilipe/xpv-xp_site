type Props = {
  title: string;
  subtitle?: string;
  icon?: string;
};

export function PageHero({ title, subtitle, icon }: Props) {
  return (
    <section className="page-hero">
      {icon && (
        <span className="page-hero-icon" aria-hidden="true">
          <i className={`fa-solid ${icon}`} />
        </span>
      )}
      <div className="page-hero-text">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}
