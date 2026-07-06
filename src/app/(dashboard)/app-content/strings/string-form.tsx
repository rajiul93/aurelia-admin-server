"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormInput, FormSelect, FormTextarea } from "@/components/form";
import { LanguageTabs } from "@/components/i18n/language-tabs";
import {
  useCreateAppUiString,
  useUpdateAppUiString,
} from "@/hooks/mutations/use-app-content-mutations";
import {
  APP_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_LABELS,
  type AppLanguage,
} from "@/lib/i18n/languages";
import {
  emptyLanguageRecord,
  translationsToRecord,
} from "@/lib/i18n/translations";
import {
  appUiStringFormSchema,
  lifecycleOptions,
  type AppUiStringFormInput,
} from "@/schemas/app-content-form.schema";
import type { AppUiString } from "@/types/app-content";

type StringFormProps = {
  mode: "create" | "edit";
  defaultValues?: AppUiString;
};

function toFormValues(record?: AppUiString): AppUiStringFormInput {
  const byLanguage = translationsToRecord(record?.translations ?? []);

  return {
    key: record?.key ?? "",
    lifecycle: record?.lifecycle ?? "ACTIVE",
    translations: emptyLanguageRecord((language) => ({
      value: byLanguage[language]?.value ?? "",
    })),
  };
}

export function StringForm({ mode, defaultValues }: StringFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] =
    useState<AppLanguage>(DEFAULT_LANGUAGE);
  const createString = useCreateAppUiString();
  const updateString = useUpdateAppUiString();

  const form = useForm<AppUiStringFormInput>({
    resolver: zodResolver(appUiStringFormSchema),
    defaultValues: toFormValues(defaultValues),
  });

  const isPending = createString.isPending || updateString.isPending;

  async function onSubmit(values: AppUiStringFormInput) {
    setSubmitError(null);

    const payload = {
      key: values.key,
      lifecycle: values.lifecycle,
      translations: emptyLanguageRecord((language) => ({
        value: values.translations[language].value,
      })),
    };

    try {
      if (mode === "edit" && defaultValues) {
        await updateString.mutateAsync({ id: defaultValues.id, payload });
      } else {
        await createString.mutateAsync(payload);
      }

      router.push("/app-content/strings");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not save UI string.",
      );
    }
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-6">
      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>String key</CardTitle>
          <CardDescription>
            Stable keys like <code>btn.plan</code> or <code>title.welcome</code>.
            Mobile resolves these offline from the app-content bundle.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput
            name="key"
            label="Key"
            placeholder="btn.plan"
            disabled={mode === "edit"}
          />
          <FormSelect
            name="lifecycle"
            label="Lifecycle"
            options={lifecycleOptions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Translations</CardTitle>
          <CardDescription>
            Required in English, Spanish, and French.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LanguageTabs value={activeLanguage} onChange={setActiveLanguage} />
          {APP_LANGUAGES.map((language) => (
            <div
              key={language}
              className={language === activeLanguage ? "space-y-4" : "hidden"}
            >
              <p className="text-muted-foreground text-sm font-medium">
                {LANGUAGE_LABELS[language]}
              </p>
              <FormTextarea
                name={`translations.${language}.value`}
                label="Value"
                rows={4}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "create" ? "Create string" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/app-content/strings" />}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
}
