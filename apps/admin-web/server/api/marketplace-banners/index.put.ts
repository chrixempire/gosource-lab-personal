import { getHeader } from 'h3';
import { putAdminLegacyMultipart } from '../../utils/admin-legacy-proxy';
import { readMarketplaceBannerFormData } from '../../utils/marketplace-banner-multipart';

export default defineEventHandler(async (event) => {
  const contentType = getHeader(event, 'content-type') ?? '';

  if (!contentType.includes('multipart/form-data')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Marketplace banner update requires multipart form data',
    });
  }

  const formData = await readMarketplaceBannerFormData(event);

  return putAdminLegacyMultipart(event, '/admin/marketplace-banners', formData, {
    fallbackMessage: 'Unable to save marketplace banners',
  });
});
