export const paginationUtil = {
  async paginate<T>({
    model,
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
    filter = {},
    search,
    searchFields = [],
    populate = [],
    select,
  }: {
    model: any;
    page?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
    filter?: Record<string, any>;
    search?: string;
    searchFields?: string[];
    populate?: Array<string | { path: string; select?: string }>;
    select?: string | Record<string, 0 | 1>;
  }): Promise<{
    data: T[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const validatedPage = Math.max(1, Math.floor(Number(page)));
    const validatedLimit = Math.min(
      200,
      Math.max(1, Math.floor(Number(limit))),
    );
    const skip = (validatedPage - 1) * validatedLimit;

    if (search && searchFields.length) {
      filter.$or = searchFields.map((field) => ({
        [field]: { $regex: search, $options: 'i' },
      }));
    }

    let query = model.find(filter).sort(sort).skip(skip).limit(validatedLimit);
    if (select) {
      query = query.select(select);
    }

    if (populate.length) {
      populate.forEach((field) => {
        if (typeof field === 'string') {
          query = query.populate(field);
        } else {
          query = query.populate(field.path, field.select);
        }
      });
    }

    const [total, data] = await Promise.all([
      model.countDocuments(filter),
      query.exec(),
    ]);

    const totalPages = Math.ceil(total / validatedLimit);

    return {
      data,
      meta: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    };
  },
};
