import { readBody } from 'h3';
import { deleteAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Category id is required',
    });
  }

  const body = await readBody<{
    deleteAll?: boolean;
    newCategoryId?: string;
  }>(event);

  return deleteAdminLegacyApi(
    event,
    `/admin/category/${id}`,
    {
      deleteAll: body.deleteAll === true,
      newCategoryId: body.newCategoryId,
    },
    {
      fallbackMessage: 'Unable to delete category',
    },
  );
});
