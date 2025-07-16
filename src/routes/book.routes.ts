import express from "express";
import * as bookController from "../controllers/book.controller";

const router = express.Router();

router.post("/", bookController.createBook);
router.get("/", bookController.getAllBooks);
router.get("/:id", bookController.getBookById);
router.get("/content/:id", bookController.getBookContentByBookId); // for premium access check

export default router;
