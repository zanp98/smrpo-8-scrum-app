import mongoose from 'mongoose';

/**
 * This middleware creates transaction when we work with any endpoint, because when we do multiple DB operations we
 * must be careful with the changes. We either want all or none.
 *
 * @param req the request
 * @param res the response
 * @param next next function
 * @returns {Promise<void>}
 */
export async function transactionMiddleware(req, res, next) {
  console.log('Session start...');
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await next();
    await session.commitTransaction();
    console.log('Transaction commit.');
  } catch (e) {
    await session.abortTransaction();
    console.error('Transaction abort.', e);
    next(e);
  } finally {
    session.endSession();
    console.log('Session end.');
  }
}
