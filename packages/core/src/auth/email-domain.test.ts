import { isEmailAllowed } from "./email-domain";

describe("isEmailAllowed", () => {
  it("allows verified email when no domain restriction is configured", () => {
    expect(
      isEmailAllowed({
        email: "user@example.com",
        emailVerified: true,
        allowedDomain: undefined,
      }),
    ).toBe(true);
  });

  it("allows unverified email when no domain restriction is configured", () => {
    expect(
      isEmailAllowed({
        email: "user@example.com",
        emailVerified: false,
        allowedDomain: undefined,
      }),
    ).toBe(true);
  });

  it("allows verified email that matches the allowed domain", () => {
    expect(
      isEmailAllowed({
        email: "employee@foo.com",
        emailVerified: true,
        allowedDomain: "foo.com",
      }),
    ).toBe(true);
  });

  it("denies verified email that does not match the allowed domain", () => {
    expect(
      isEmailAllowed({
        email: "intruder@bar.com",
        emailVerified: true,
        allowedDomain: "foo.com",
      }),
    ).toBe(false);
  });

  it("denies unverified email even if domain matches", () => {
    expect(
      isEmailAllowed({
        email: "employee@foo.com",
        emailVerified: false,
        allowedDomain: "foo.com",
      }),
    ).toBe(false);
  });

  it("allows verified email matching the first domain in a comma-separated list", () => {
    expect(
      isEmailAllowed({
        email: "alice@foo.com",
        emailVerified: true,
        allowedDomain: "foo.com,bar.com",
      }),
    ).toBe(true);
  });

  it("allows verified email matching the second domain in a comma-separated list", () => {
    expect(
      isEmailAllowed({
        email: "bob@bar.com",
        emailVerified: true,
        allowedDomain: "foo.com,bar.com",
      }),
    ).toBe(true);
  });

  it("denies verified email matching no domain in a comma-separated list", () => {
    expect(
      isEmailAllowed({
        email: "intruder@baz.com",
        emailVerified: true,
        allowedDomain: "foo.com,bar.com",
      }),
    ).toBe(false);
  });

  it("tolerates whitespace around commas in the domain list", () => {
    expect(
      isEmailAllowed({
        email: "carol@bar.com",
        emailVerified: true,
        allowedDomain: " foo.com ,  bar.com  ",
      }),
    ).toBe(true);
  });

  it("treats a list of only whitespace and commas as no restriction", () => {
    expect(
      isEmailAllowed({
        email: "user@anything.com",
        emailVerified: false,
        allowedDomain: "  ,  ,",
      }),
    ).toBe(true);
  });

  it("matches case-insensitively across multiple domains", () => {
    expect(
      isEmailAllowed({
        email: "Dave@BAR.COM",
        emailVerified: true,
        allowedDomain: "FOO.com,Bar.COM",
      }),
    ).toBe(true);
  });

  it("denies unverified email even when the domain list matches", () => {
    expect(
      isEmailAllowed({
        email: "eve@bar.com",
        emailVerified: false,
        allowedDomain: "foo.com,bar.com",
      }),
    ).toBe(false);
  });
});
