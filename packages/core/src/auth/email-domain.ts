/**
 * Determine whether an email is allowed to sign in based on a configured
 * domain restriction and whether the email has been verified by the identity
 * provider.
 *
 * The rules are:
 * 1. If `allowedDomain` is _undefined_ or an empty string, **all** emails are
 *    allowed (i.e. the check is disabled).
 * 2. The email _must_ be verified (`emailVerified === true`).
 * 3. The email address (case-insensitive) must end with `@${domain}` for at
 *    least one domain in the configured list. `allowedDomain` may be a single
 *    domain (`example.com`) or a comma-separated list (`a.com,b.com`).
 *    Whitespace around commas is tolerated. Each domain is supplied without
 *    the leading `@`.
 *
 * @param params.email          The email address returned by the provider.
 * @param params.emailVerified  Whether the provider asserts that the email is
 *                              verified.
 * @param params.allowedDomain  The configured domain restriction. May be a
 *                              single domain or a comma-separated list. If
 *                              omitted/empty the restriction is disabled.
 *
 * @returns `true` if the email passes all checks, `false` otherwise.
 */
export function isEmailAllowed({
  email,
  emailVerified,
  allowedDomain,
}: {
  email: string | null | undefined;
  emailVerified: boolean;
  allowedDomain?: string | null;
}): boolean {
  if (!allowedDomain || allowedDomain.trim() === "") {
    // No configured restriction – allow all emails
    return true;
  }

  const domains = allowedDomain
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0);

  if (domains.length === 0) {
    // String had only whitespace/commas – treat as no restriction
    return true;
  }

  if (!emailVerified || !email) {
    return false;
  }

  const emailLower = email.toLowerCase();
  return domains.some((domain) => emailLower.endsWith(`@${domain}`));
}
