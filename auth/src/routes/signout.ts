import express, { NextFunction } from "express";

const router = express.Router();

router.post("/api/users/signout", (req, res, next: NextFunction) => {
  try {
    req.session = null;

    res.send({});
  } catch (e) {
    next(e);
  }
});

export { router as signoutRouter };
