"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormImageUpload, FormInput, FormSelect } from "@/components/form";
import { useStaffProfile } from "@/hooks/queries/use-staff-profile";
import { authClient } from "@/lib/auth/client";
import { resolveMediaUpload } from "@/lib/media/client";
import { queryKeys } from "@/lib/query/keys";
import { STAFF_ROLES } from "@/lib/auth/rbac";
import { fetchAndStoreSession } from "@/lib/auth/token-manager";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/schemas/profile.schema";
import { staffProfileService } from "@/services/staff-profile.service";
import { useAuthStore } from "@/store/auth-store";
import { defaultMediaFieldValue } from "@/types/media";

const roleOptions = STAFF_ROLES.map((role) => ({
  label: role,
  value: role,
}));

export function ProfileUpdateForm() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { data: staffProfileResponse, isLoading: isProfileLoading } =
    useStaffProfile();
  const staffProfile = staffProfileResponse?.data;
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name ?? "",
      role: user?.role ?? "MANAGER",
      avatar: defaultMediaFieldValue,
    },
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    form.reset({
      name: user.name,
      role: user.role,
      avatar: defaultMediaFieldValue,
    });
  }, [user, staffProfile, form]);

  if (!user) {
    return (
      <p className="text-muted-foreground text-sm">
        Sign in to update your profile.
      </p>
    );
  }

  if (isProfileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-24 rounded-xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  async function onSubmit(values: ProfileUpdateInput) {
    setSubmitError(null);
    setSuccessMessage(null);
    setUploadProgress(null);

    try {
      const nameResponse = await authClient.updateUser({
        name: values.name,
      });

      if (nameResponse.error) {
        setSubmitError(nameResponse.error.message ?? "Unable to update profile.");
        return;
      }

      const hasAvatarChange =
        values.avatar.file !== null || values.avatar.removeExisting;

      let nextAvatarMediaId = staffProfile?.avatarMediaId ?? null;

      if (hasAvatarChange) {
        setIsUploadingMedia(true);
        nextAvatarMediaId =
          (await resolveMediaUpload(
            values.avatar,
            staffProfile?.avatarMediaId,
            {
              onProgress: setUploadProgress,
            },
          )) ?? null;

        await staffProfileService.updateAvatar(nextAvatarMediaId);
      }

      updateUser({ name: values.name });
      await fetchAndStoreSession();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.staffProfile.me,
      });

      form.reset({
        name: values.name,
        role: values.role,
        avatar: defaultMediaFieldValue,
      });

      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to update profile.",
      );
    } finally {
      setIsUploadingMedia(false);
      setUploadProgress(null);
    }
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-4">
      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <FormImageUpload
        name="avatar"
        label="Profile photo"
        description="Choose an image now. It uploads when you save."
        existingMedia={staffProfile?.avatarMedia}
        isUploading={isUploadingMedia}
        uploadProgress={uploadProgress ?? undefined}
        disabled={form.formState.isSubmitting}
      />

      <FormInput
        name="name"
        label="Full name"
        placeholder="Your name"
        autoComplete="name"
      />

      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={user.email} disabled />
        <p className="text-muted-foreground text-xs">
          Contact an admin to change your email.
        </p>
      </div>

      <FormSelect
        name="role"
        label="Role"
        options={roleOptions}
        disabled
        description="Your staff role is managed by an administrator."
      />

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting || isUploadingMedia}
      >
        {form.formState.isSubmitting || isUploadingMedia ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {isUploadingMedia ? "Uploading image..." : "Saving..."}
          </>
        ) : (
          "Save profile"
        )}
      </Button>
    </Form>
  );
}
