import api from "./api.js";

export const updateUserProfile = (formData) =>
  api.put("/user/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const changeUserPassword = (payload) =>
  api.put("/user/change-password", payload);

export const deleteUserAccount = (payload) =>
  api.delete("/user/delete-account", {
    data: payload,
  });
