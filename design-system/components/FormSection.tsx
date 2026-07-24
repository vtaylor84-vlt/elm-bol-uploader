import React from 'react';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Constrained form grouping for desktop — avoids full-bleed stretched fields. */
const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => (
  <section className={`mc-form-section ${className}`.trim()}>
    {title || description ? (
      <header className="mb-4">
        {title ? <h2 className="mc-section-title">{title}</h2> : null}
        {description ? <p className="mc-section-copy">{description}</p> : null}
      </header>
    ) : null}
    <div className="mc-field-grid">{children}</div>
  </section>
);

export default FormSection;
