import { SmrpoError } from './errors.js';

export const errorHandlerWrapped = (func) => {
  return async (req, res, next) => {
    try {
      return await func(req, res, next);
    } catch (error) {
      if (error instanceof SmrpoError) {
        console.error(`Error occurred for user[${req?.user?.id}]`, error);
        return res.status(error.statusCode).send({ message: error.message });
      }
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };
};
