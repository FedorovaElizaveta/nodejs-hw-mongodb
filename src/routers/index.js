import { Router } from 'express';
import contactsRouter from './contacts.js';
import authRouter from './auth.js';
import { auth } from '../middlewares/auth.js';
import { swaggerDocs } from '../middlewares/swaggerDocs.js';

const router = Router();

router.use('/api-docs', swaggerDocs());
router.use('/contacts', auth, contactsRouter);
router.use('/auth', authRouter);

export default router;
