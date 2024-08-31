import { ContactsCollection } from '../db/models.js';

export const getAllContacts = async () => {
  const contacts = await ContactsCollection.find();
  return contacts;
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
