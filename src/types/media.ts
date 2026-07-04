export type Media = {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  key: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

export type MediaFieldValue = {
  file: File | null;
  removeExisting: boolean;
};

export const defaultMediaFieldValue: MediaFieldValue = {
  file: null,
  removeExisting: false,
};

export type StaffProfile = {
  authUserId: string;
  avatarMediaId: string | null;
  avatarMedia: Media | null;
};

export type UploadProgressHandler = (percent: number) => void;

export type MediaUploadOptions = {
  onProgress?: UploadProgressHandler;
};
