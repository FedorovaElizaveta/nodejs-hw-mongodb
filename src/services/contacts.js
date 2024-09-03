import { ContactsCollection } from '../db/models.js';
import { calculatePaginationData } from '../utilts/calculatePaginationData.js';
import { SORT_ORDER } from '../constants/index.js';

export const getAllContacts = async ({
  page = 1,
  perPage = 10,
  sortBy = '_id',
  sortOrder = SORT_ORDER.ASC,
  contactType,
  isFavourite,
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;

  const contactsQuery = ContactsCollection.find();

  if (contactType) {
    contactsQuery.where('contactType').equals(contactType);
  }

  if (isFavourite !== undefined) {
    contactsQuery.where('isFavourite').equals(isFavourite);
  }

  const [contactsCount, contacts] = await Promise.all([
    ContactsCollection.find().merge(contactsQuery).countDocuments(),
    contactsQuery
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .exec(),
  ]);

  const paginationData = calculatePaginationData(contactsCount, page, perPage);

  return { data: contacts, ...paginationData };
};

export const getContactById = async (id) => {
  const contact = await ContactsCollection.findById(id);
  return contact;
};

export const createContact = async (newContact) => {
  const contact = await ContactsCollection.create(newContact);
  return contact;
};

export const patchContact = async (id, contact, options = {}) => {
  const result = await ContactsCollection.findOneAndUpdate(
    {
      _id: id,
    },
    contact,
    {
      new: true,
      includeResultMetadata: true,
      ...options,
    },
  );

  if (!result || result.value === null) return null;

  return {
    contact: result.value,
  };
};

export const deleteContact = async (id) => {
  const contact = await ContactsCollection.findByIdAndDelete({ _id: id });
  return contact;
};
