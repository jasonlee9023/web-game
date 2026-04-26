interface SeoInput {
  title: string;
  description?: string;
}

export function applySeo({ title, description }: SeoInput) {
  document.title = `${title} | Casual Game World`;

  if (!description) {
    return;
  }

  let meta = document.querySelector('meta[name="description"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', description);
}

