/**
 * Dynamically validates a listing's custom fields against a Category's fieldSchema.
 * Returns { isValid: boolean, errors: string[], validatedFields: object }
 */
const validateListingFields = (fields, fieldSchema) => {
  const errors = [];
  const validatedFields = {};

  if (!fieldSchema || typeof fieldSchema !== 'object') {
    return { isValid: true, errors, validatedFields: fields };
  }

  for (const [fieldName, rules] of Object.entries(fieldSchema)) {
    const value = fields?.[fieldName];

    // Check if required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${fieldName}' is required.`);
      continue;
    }

    // Skip if optional and empty
    if (value === undefined || value === null || value === '') {
      validatedFields[fieldName] = null;
      continue;
    }

    // Validate based on type
    if (rules.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        errors.push(`Field '${fieldName}' must be a number.`);
      } else {
        validatedFields[fieldName] = numValue;
      }
    } else if (rules.type === 'enum') {
      if (!rules.values.includes(value)) {
        errors.push(`Field '${fieldName}' must be one of: ${rules.values.join(', ')}.`);
      } else {
        validatedFields[fieldName] = value;
      }
    } else if (rules.type === 'array') {
      let arrValue = value;
      if (typeof value === 'string') {
        try {
          arrValue = JSON.parse(value);
        } catch {
          // If it's a comma-separated string, convert it to array
          arrValue = value.split(',').map(x => x.trim()).filter(Boolean);
        }
      }

      if (!Array.isArray(arrValue)) {
        errors.push(`Field '${fieldName}' must be an array.`);
      } else if (arrValue.length === 0 && rules.required) {
        errors.push(`Field '${fieldName}' must contain at least one item.`);
      } else {
        validatedFields[fieldName] = arrValue.map(x => x.toString());
      }
    } else if (rules.type === 'string') {
      validatedFields[fieldName] = value.toString().trim();
    } else {
      // Catch-all
      validatedFields[fieldName] = value;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedFields,
  };
};

module.exports = {
  validateListingFields,
};
