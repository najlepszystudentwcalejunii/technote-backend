const express = require("express");
const router = express.Router();
const notesController = require("../controllers/notesController");
const verifyJwt = require("../middleware/verifyJwt");

router.use(verifyJwt);

router
   .route("/")
   .get(notesController.getAllNotes)
   .post(notesController.createNote)
   .patch(notesController.updateNote)
   .delete(notesController.deleteNote);

module.exports = router;
