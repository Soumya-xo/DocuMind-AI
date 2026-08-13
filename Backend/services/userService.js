import fs from "fs/promises";
import path from "path";
import User from "../models/User.js";
import PDF from "../models/PDF.js";
import Chat from "../models/Chat.js";

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const safeParseObjectId = (val) => val;

export const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");
  return user;
};

export const updateUserProfile = async ({ userId, name, avatarPath }) => {
  const user = await User.findById(userId);
  if (!user) return null;

  if (typeof name === "string") user.name = name;
  if (avatarPath) user.avatar = avatarPath;

  await user.save();

  const updated = await User.findById(userId).select("-password");
  return updated;
};

export const changeUserPassword = async ({
  userId,
  currentPassword,
  newPassword,
  comparePasswordFn,
}) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return { ok: false, message: "Current password is incorrect." };
  }

  user.password = newPassword;
  await user.save();

  return { ok: true };
};

const buildUserVectorStorePath = (vectorstoreBasePath, userId) => {
  return path.join(vectorstoreBasePath, `user_${userId}`);
};

const recursivelyDeleteFolder = async (folderPath) => {
  try {
    await fs.rm(folderPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
};

const deleteUserFilesFromUploads = async (uploadsBasePath, userId) => {
  // NOTE: Current codebase stores uploaded files under uploads/ without a guaranteed naming scheme.
  // We therefore delete files that contain the userId in their filename OR have a matching prefix.
  // If your upload naming differs, adjust this matcher.
  try {
    const files = await fs.readdir(uploadsBasePath);
    const matchers = [`${userId}_`, `user_${userId}_`, `_${userId}_`];

    const toDelete = files.filter((f) => matchers.some((m) => f.includes(m)));
    await Promise.all(
      toDelete.map((f) =>
        fs.rm(path.join(uploadsBasePath, f), { force: true }),
      ),
    );
  } catch {
    // ignore
  }
};

export const deleteUserEverything = async ({
  userId,
  uploadsBasePath,
  vectorstoreBasePath,
}) => {
  // Delete PDF records first (also gives us a chance to match file paths)
  await PDF.deleteMany({ userId: safeParseObjectId(userId) });
  await Chat.deleteMany({ userId: safeParseObjectId(userId) });

  await User.findByIdAndDelete(userId);

  // Delete files from uploads and vectorstore
  await deleteUserFilesFromUploads(uploadsBasePath, userId);
  const userVectorStorePath = buildUserVectorStorePath(
    vectorstoreBasePath,
    userId,
  );
  await recursivelyDeleteFolder(userVectorStorePath);

  // Any other user-owned data can be deleted here.
  return { ok: true };
};
