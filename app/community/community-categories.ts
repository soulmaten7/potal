export interface CommunityCategory {
  slug: string;
  icon: string;
  label: string;
  description: string;
  adminOnly: boolean;
}

export const COMMUNITY_CATEGORIES: CommunityCategory[] = [
  { slug: 'announcements', icon: '\ud83d\udce2', label: 'Announcements', description: 'Official updates, new features, and policy changes', adminOnly: true },
  { slug: 'getting-started', icon: '\ud83d\ude80', label: 'Getting Started', description: 'New to POTAL? Ask your first questions here', adminOnly: false },
  { slug: 'bug-reports', icon: '\ud83d\udc1b', label: 'Bug Reports', description: 'Found something broken? Report it here', adminOnly: false },
  { slug: 'feature-requests', icon: '\ud83d\udca1', label: 'Feature Requests', description: 'Suggest new features or improvements', adminOnly: false },
  { slug: 'tips-howto', icon: '\ud83d\udc8e', label: 'Tips & How-to', description: 'Share your workflows, tips, and best practices', adminOnly: false },
  { slug: 'api-integrations', icon: '\ud83d\udd17', label: 'API & Integrations', description: 'Technical questions about API, Shopify, WooCommerce, and more', adminOnly: false },
  { slug: 'general', icon: '\ud83d\udcac', label: 'General Discussion', description: 'Cross-border commerce talk, industry news, and more', adminOnly: false },
  { slug: 'release-notes', icon: '\ud83d\udccb', label: 'Release Notes', description: 'Version history and technical changelog', adminOnly: true },
];

export const ADMIN_EMAILS = ['soulmaten7@gmail.com', 'contact@potal.app'];

export const CATEGORY_MAP = Object.fromEntries(COMMUNITY_CATEGORIES.map(c => [c.slug, c]));

export const USER_CATEGORIES = COMMUNITY_CATEGORIES.filter(c => !c.adminOnly);

export const VALID_CATEGORY_SLUGS = COMMUNITY_CATEGORIES.map(c => c.slug);
