const Note = require("../models/Note");
const User = require("../models/User");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

//@desc Get all notes
//@route GET /notes
//@access private
const getAllNotes = asyncHandler(async (req, res) => {
   const notes = await Note.find().lean();
   if (!notes.length)
      return res.status(400).json({ message: "No notes found" });

   const notesWithUser = await Promise.all(
      notes.map(async (note) => {
         const user = await User.findById(note.user).lean().exec();
         return { ...note, username: user.username };
      })
   );

   res.json(notesWithUser);
});

//@desc Create new note
//@route POST /notes
//@access private
const createNote = asyncHandler(async (req, res) => {
   const { user, title, text } = req.body;

   if (!user || !title || !text)
      return res.status(400).json({ message: "All fields are required" });

   if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({ message: "Invalid user ID" });
   }

   const duplicate = await Note.findOne({ title })
      .collation({ locale: "en", strength: 2 })
      .lean()
      .exec();

   if (duplicate)
      return res.status(409).json({ message: "Duplicate note title" });

   const foundUser = await User.findById(user);
   if (!foundUser)
      return res.status(400).json({ message: "User doesnt exist" });

   const note = await Note.create({ user, title, text });
   if (!note) return res.status(500).json({ message: "Failed to create note" });
   res.status(201).json(note);
});

//@desc Update a note
//@route PATCH /notes
//@access private
const updateNote = asyncHandler(async (req, res) => {
   const { id, user, title, text, completed } = req.body;

   if (!user || !title || !text || !id || typeof completed !== "boolean")
      return res.status(400).json({ message: "All fields are required" });

   if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({ message: "Invalid user ID" });
   }

   if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid note ID" });
   }

   const duplicate = await Note.findOne({ title })
      .collation({ locale: "en", strength: 2 })
      .lean()
      .exec();

   if (duplicate)
      return res.status(409).json({ message: "Duplicate note title" });

   const foundUser = await User.findById(user).exec();
   if (!foundUser)
      return res.status(400).json({ message: "User does not exist" });

   const foundNote = await Note.findById(id).exec();
   if (!foundNote)
      return res.status(400).json({ message: "Note does not exist" });

   foundNote.user = user;
   foundNote.title = title;
   foundNote.text = text;
   foundNote.completed = completed;

   const result = await foundNote.save();
   res.status(200).json({ message: `Note ${id} updated` });
});

//@desc Delete a note
//@route DELETE /notes
//@access private
const deleteNote = asyncHandler(async (req, res) => {
   const { id } = req.body;
   if (!id) return res.status(400).json({ message: "All fields are required" });
   const note = await Note.findById(id).exec();
   if (!note)
      return res
         .status(400)
         .json({ message: "Note with given id does not exist" });
   const result = await Note.deleteOne({ _id: id });
   if (!result.acknowledged)
      return res.json({ message: "Delete operation could not complete" });
   res.json({ message: `Note with id ${id} has been deleted` });
});
module.exports = { getAllNotes, createNote, updateNote, deleteNote };
