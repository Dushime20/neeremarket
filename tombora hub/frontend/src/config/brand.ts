/** Marketplace brand — display name for UI, titles, and marketing copy. */
export const APP_NAME = 'NeereMarket';
export const APP_MARK = 'NM';
export const APP_TAGLINE = "Rwanda's Digital Marketplace";
export const APP_LOGO_SRC = '/neeremarket-logo.png';

export function pageTitle(section?: string) {
  return section ? `${section} | ${APP_NAME}` : APP_NAME;
}
