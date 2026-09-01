import { api } from '../api/client';

export const trackGumroadClick = async (
  productId: string,
  productTitle: string,
  targetUrl: string
): Promise<void> => {
  try {
    await api.trackEvent({
      eventType: 'gumroad_click',
      productId,
      productTitle,
      metadata: { targetUrl },
    });
  } catch {
    // Silently fail
  }
};
