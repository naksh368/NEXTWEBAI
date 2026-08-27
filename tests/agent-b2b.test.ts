import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PASSWORD_POLICY, passwordStrength, maskPan, requiredDocsFor,
  PAN_REGEX, GSTIN_REGEX, PIN_REGEX,
} from "../src/lib/agent-constants";
import { validateUpload } from "../src/lib/agent-schemas";

test("password policy requires 12+ chars with all classes", () => {
  assert.equal(PASSWORD_POLICY.regex.test("short1!A"), false); // too short
  assert.equal(PASSWORD_POLICY.regex.test("alllowercase1!"), false); // no upper
  assert.equal(PASSWORD_POLICY.regex.test("NOLOWER1234!"), false); // no lower
  assert.equal(PASSWORD_POLICY.regex.test("NoSpecial1234"), false); // no special
  assert.equal(PASSWORD_POLICY.regex.test("NoNumber!!!!!"), false); // no digit
  assert.equal(PASSWORD_POLICY.regex.test("Str0ng!Passw0rd"), true); // valid
});

test("password strength increases with complexity", () => {
  assert.ok(passwordStrength("Str0ng!Passw0rdLong").score >= 4);
  assert.ok(passwordStrength("abc").score <= 1);
});

test("PAN is masked keeping first 3 and last 2", () => {
  assert.equal(maskPan("ABCDE1234F"), "ABCXXXXX4F");
  assert.equal(maskPan(null), "—");
  assert.equal(maskPan("AB"), "••••");
});

test("format regexes accept valid and reject invalid", () => {
  assert.equal(PAN_REGEX.test("ABCDE1234F"), true);
  assert.equal(PAN_REGEX.test("ABCDE12345"), false);
  assert.equal(GSTIN_REGEX.test("22ABCDE1234F1Z5"), true);
  assert.equal(GSTIN_REGEX.test("BADGSTIN"), false);
  assert.equal(PIN_REGEX.test("560001"), true);
  assert.equal(PIN_REGEX.test("012345"), false);
});

test("document requirements vary by business type", () => {
  const priv = requiredDocsFor("PRIVATE_LIMITED").map((d) => d.type);
  assert.ok(priv.includes("INCORPORATION"));
  assert.ok(priv.includes("SIGNATORY"));
  const prop = requiredDocsFor("PROPRIETORSHIP").map((d) => d.type);
  assert.ok(!prop.includes("INCORPORATION"));
  assert.ok(prop.includes("PAN"));
});

test("upload validation blocks executables and oversized files", () => {
  assert.equal(validateUpload({ name: "pan.pdf", type: "application/pdf", size: 1000 }, "DOC").ok, true);
  assert.equal(validateUpload({ name: "malware.exe", type: "application/pdf", size: 1000 }, "DOC").ok, false);
  assert.equal(validateUpload({ name: "logo.gif", type: "image/gif", size: 1000 }, "LOGO").ok, false); // gif not allowed for logo
  assert.equal(validateUpload({ name: "big.pdf", type: "application/pdf", size: 20 * 1024 * 1024 }, "DOC").ok, false);
  assert.equal(validateUpload({ name: "logo.png", type: "image/png", size: 5000 }, "LOGO").ok, true);
});
