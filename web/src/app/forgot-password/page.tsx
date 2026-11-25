import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password">) {
  const params = await searchParams;
  const initialError =
    params.error === "link"
      ? "That reset link is invalid or has expired. Request a new one."
      : null;

  return <ForgotPasswordForm initialError={initialError} />;
}
