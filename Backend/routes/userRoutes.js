import express from "express";
import multer from "multer";
import protect from "../middleware/authMiddleware.js";
import {
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/userController.js";

const router = express.Router();

// Store uploaded avatars under Backend/uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `avatar_${req.user.id}_${Date.now()}.${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.put("/profile", protect, upload.single("avatar"), updateProfile);
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteAccount);

export default router;
