const parseContactType = (contactType) => {
  const isString = typeof contactType === 'string';
  if (!isString) return;

  const possibleValues = ['work', 'home', 'personal'];
  if (possibleValues.includes(contactType)) return contactType;

  return;
};

const parseIsFavourite = (isFavourite) => {
  if (isFavourite === undefined || isFavourite === '') return;

  if (isFavourite === 'true') return true;
  if (isFavourite === 'false') return false;

  return;
};

export const parseFilterParams = (query) => {
  const { contactType, isFavourite } = query;

  const parsedContactType = parseContactType(contactType);
  const parsedIsFavourite = parseIsFavourite(isFavourite);

  return {
    contactType: parsedContactType,
    isFavourite: parsedIsFavourite,
  };
};
