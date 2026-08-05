import assert from "node:assert/strict";
import test from "node:test";

import { getCheckboxInput } from "./form-inputs.ts";

test("an unchecked checkbox is false when the browser omits it from FormData", () => {
  const formData = new FormData();

  assert.equal(getCheckboxInput(formData, "active"), false);
});

test("a checked checkbox is true", () => {
  const formData = new FormData();
  formData.append("active", "true");

  assert.equal(getCheckboxInput(formData, "active"), true);
});

test("a checked checkbox wins over a false fallback value", () => {
  const formData = new FormData();
  formData.append("active", "false");
  formData.append("active", "true");

  assert.equal(getCheckboxInput(formData, "active"), true);
});
