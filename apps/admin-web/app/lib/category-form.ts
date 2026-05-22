export type CategoryFormValues = {
  name: string;
  description: string;
  imageFile: File | null;
};

export function createEmptyCategoryFormValues(): CategoryFormValues {
  return {
    name: '',
    description: '',
    imageFile: null,
  };
}

export function mapLegacyCategoryToFormValues(category: {
  name?: string;
  desc?: string;
}): CategoryFormValues {
  return {
    name: category.name ?? '',
    description: category.desc ?? '',
    imageFile: null,
  };
}

export function validateCategoryForm(
  values: CategoryFormValues,
  options?: { isEdit?: boolean; hasExistingImage?: boolean },
) {
  const errors: Record<string, string> = {};
  const name = values.name.trim();
  const hasImage = Boolean(values.imageFile) || options?.hasExistingImage === true;

  if (!name) {
    errors.name = 'Name is required';
  }

  if (!options?.isEdit && !hasImage) {
    errors.image = 'Please upload an image';
  }

  return errors;
}

/** Remove validation messages for fields that now pass (e.g. after the user edits). */
export function clearResolvedCategoryFieldErrors(
  values: CategoryFormValues,
  fieldErrors: Record<string, string>,
  options?: { isEdit?: boolean; hasExistingImage?: boolean },
) {
  const latest = validateCategoryForm(values, options);

  for (const key of Object.keys(fieldErrors)) {
    if (!(key in latest)) {
      delete fieldErrors[key];
    }
  }
}

export function buildCategoryRequestBody(values: CategoryFormValues) {
  return {
    name: values.name.trim(),
    desc: values.description.trim(),
  };
}

export function buildCategoryFormData(values: CategoryFormValues) {
  const formData = new FormData();
  formData.append('name', values.name.trim());
  formData.append('desc', values.description.trim());

  if (values.imageFile) {
    formData.append('images', values.imageFile);
  }

  return formData;
}
