import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description?: string;
}

export function usePageSeo({ title, description }: SeoProps) {
  useEffect(() => {
    // Update title
    document.title = title;

    if (description) {
      // Update meta description
      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) {
        descMeta.setAttribute('content', description);
      }

      // Update OG title & description
      const ogTitleMeta = document.querySelector('meta[property="og:title"]');
      if (ogTitleMeta) {
        ogTitleMeta.setAttribute('content', title);
      }
      const ogDescMeta = document.querySelector('meta[property="og:description"]');
      if (ogDescMeta) {
        ogDescMeta.setAttribute('content', description);
      }

      // Update Twitter title & description
      const twTitleMeta = document.querySelector('meta[name="twitter:title"]');
      if (twTitleMeta) {
        twTitleMeta.setAttribute('content', title);
      }
      const twDescMeta = document.querySelector('meta[name="twitter:description"]');
      if (twDescMeta) {
        twDescMeta.setAttribute('content', description);
      }
    }
  }, [title, description]);
}
