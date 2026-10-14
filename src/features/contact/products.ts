/**
 * How the registered products appear on the contact page: a type, an icon from @wolfsblvt/icons (or the dashed
 * initial placeholder until one exists), and the home a visitor arriving from it can go back to. Keyed by the
 * contract's slugs and kept in the contract's hand order; the build refuses a product without presentation.
 */
import { PRODUCTS, type ProductSlug } from '../../../shared/contact-contract';

export interface ProductPresentation {
  type: 'Website' | 'Tool' | 'Project' | 'Extension';
  /** A product glyph in @wolfsblvt/icons; absent means the dashed initial placeholder. */
  icon?: 'wolfsblvt/works' | 'diffdevil/brand';
  /** Where "back to" goes for a visitor who arrived with ?product=. */
  home: string;
}

const PRESENTATION: Record<ProductSlug, ProductPresentation> = {
  'wolfsblvt-works': { type: 'Website', icon: 'wolfsblvt/works', home: 'https://wolfsblvt.works/' },
  diffdevil: { type: 'Tool', icon: 'diffdevil/brand', home: 'https://diffdevil.dev/' },
  'wolfsblvt-com': { type: 'Website', home: 'https://wolfsblvt.com/' },
  agents: { type: 'Website', home: 'https://agents.wolfsblvt.com/' },
};

export interface ContactProduct extends ProductPresentation {
  slug: ProductSlug;
  label: string;
  /** The placeholder's letter: the label's first letter, ignoring "Wolf's". */
  initial: string;
}

export const CONTACT_PRODUCTS: readonly ContactProduct[] = PRODUCTS.map((product) => {
  const presentation = PRESENTATION[product.slug];
  if (!presentation) throw new Error(`Contact product ${product.slug} has no presentation in src/features/contact/products.ts.`);
  return { slug: product.slug, label: product.label, initial: product.label.replace(/^Wolf's /, '').charAt(0).toUpperCase(), ...presentation };
});
