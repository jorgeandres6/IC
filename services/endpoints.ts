import { SocialPlatform } from '../types';

export const SCRAPE_CREATORS_PROFILE_ENDPOINTS: Record<SocialPlatform, string> = {
  instagram: 'https://api.scrapecreators.com/v1/instagram/profile',
  facebook: 'https://api.scrapecreators.com/v1/facebook/profile',
  tiktok: 'https://api.scrapecreators.com/v1/tiktok/profile',
  x: 'https://api.scrapecreators.com/v1/twitter/profile'
};