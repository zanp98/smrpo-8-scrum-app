import { SmrpoError } from './errors.js';

export const errorHandlerWrapped = (func) => {
  return async (req, res, next) => {
    try {
      return await func(req, res, next);
    } catch (error) {
      if (error instanceof SmrpoError) {
        return res.status(error.statusCode).send(error.message);
      }
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };
};
