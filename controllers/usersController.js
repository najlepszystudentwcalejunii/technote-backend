const User = require("../models/User");
const Note = require("../models/Note");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");

//@desc Get all users
//@route GET /users
//@access Private
const getAllUsers = asyncHandler(async (req, res) => {
   const users = await User.find().select("-password").lean();
   if (!users?.length)
      return res.status(400).json({ message: "No users found" });
   res.json(users);
});

//@desc Create new user
//@route POST /users
//@access Private
const createNewUser = asyncHandler(async (req, res) => {
   const { username, password, roles } = req.body;

   if (!username || !password)
      return res.status(400).json({ message: "All fields are required" });

   const duplicate = await User.findOne({ username })
      .collation({ locale: "en", strength: 2 })
      .lean()
      .exec();
   if (duplicate)
      return res.status(409).json({ message: "User already exists" });

   const hashedPwd = await bcrypt.hash(password, 11);

   const userObject =
      !Array.isArray(roles) || !roles.length
         ? { username, password: hashedPwd }
         : { username, password: hashedPwd, roles };

   const user = await User.create(userObject);
   if (user) {
      res.status(201).json({ message: `New user ${username} created` });
   } else {
      res.status(400).json({ message: "Invalid user data received" });
   }
});

//@desc Update user
//@route PATCH /users
//@access Private
const updateUser = asyncHandler(async (req, res) => {
   const { id, username, roles, active, password } = req.body;
   if (
      !id ||
      !username ||
      !Array.isArray(roles) ||
      !roles.length ||
      !active ||
      typeof active !== "boolean"
   ) {
      console.log(typeof active);
      return res.status(400).json({ message: "All fields are required" });
   }

   if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
   }

   const user = await User.findById(id).exec();

   if (!user) return res.status(400).json({ message: "User not found" });

   const duplicate = await User.findOne({ username })
      .collation({ locale: "en", strength: 2 })
      .lean()
      .exec();

   if (duplicate && duplicate?._id.toString() !== id) {
      return res.status(409).json({ message: "Duplicate username" });
   }

   user.username = username;
   user.roles = roles;
   user.active = active;
   if (password && password.trim()) {
      user.password = await bcrypt.hash(password, 11);
   }

   const updateUser = await user.save();
   res.status(200).json({ message: `${updateUser.username} updated` });
});
//@desc Delete user
//@route DELETE /users
//@access Private
const deleteUser = asyncHandler(async (req, res) => {
   const { id } = req.body;
   if (!id) return res.status(400).json({ message: "User id required" });
   const assignedNote = await Note.findOne({ user: id }).lean().exec();
   if (assignedNote) {
      return res.status(400).json({ message: "User has assigned notes" });
   }
   const user = await User.findById(id).exec();

   if (!user) return res.status(400).json({ message: "User not found" });

   const { acknowledged } = await user.deleteOne();
   if (acknowledged) {
      const reply = `Username ${user.username} with id ${user._id} deleted`;
      return res.json(reply);
   }
   res.status(400).json({ message: "Delete could not complete" });
});

module.exports = { getAllUsers, createNewUser, updateUser, deleteUser };
