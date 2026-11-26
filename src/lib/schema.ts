/** JSON-LD for the site: the website, its publisher and the breadcrumb of each page. */
import { APP } from '../vasija';
import { PROD_ORIGIN, PUBLISHER } from './site';
import { canonicalUrl } from './url';

export type JsonLdNode = Record<string, unknown>;

export interface Crumb {
  name: string;
  /** Site-relative path, for example /soporte/. */
  path: string;
}

const PUBLISHER_ID = `${PROD_ORIGIN}/#publisher`;

/** The website, its publisher and the app, on every page. */
export function sitewideSchema(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': PUBLISHER_ID,
        name: PUBLISHER.name,
        url: PUBLISHER.url,
        email: APP.email,
        address: { '@type': 'PostalAddress', addressCountry: 'UY' },
      },
      {
        '@type': 'WebSite',
        '@id': `${PROD_ORIGIN}/#website`,
        url: `${PROD_ORIGIN}/`,
        name: APP.name,
        alternateName: APP.fullName,
        inLanguage: 'es',
        publisher: { '@id': PUBLISHER_ID },
      },
      {
        '@type': 'MobileApplication',
        '@id': `${PROD_ORIGIN}/#app`,
        name: APP.name,
        alternateName: APP.storeName,
        description: APP.tagline,
        operatingSystem: 'iOS, Android',
        applicationCategory: 'LifestyleApplication',
        inLanguage: 'es',
        publisher: { '@id': PUBLISHER_ID },
      },
    ],
  };
}

export function breadcrumbSchema(crumbs: Crumb[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: canonicalUrl(c.path),
    })),
  };
}
