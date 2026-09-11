import assert from "node:assert/strict";
import test from "node:test";

import { MAX_ATTACHMENT_SIZE_BYTES, formatFileSize, isFileTooLarge } from "./upload-limits";

test("isFileTooLarge: arquivo abaixo do limite passa", () => {
  assert.equal(isFileTooLarge(8 * 1024 * 1024), false);
});

test("isFileTooLarge: arquivo exatamente no limite passa", () => {
  assert.equal(isFileTooLarge(MAX_ATTACHMENT_SIZE_BYTES), false);
});

test("isFileTooLarge: arquivo acima do limite e rejeitado", () => {
  assert.equal(isFileTooLarge(MAX_ATTACHMENT_SIZE_BYTES + 1), true);
});

test("formatFileSize: bytes", () => {
  assert.equal(formatFileSize(512), "512 B");
});

test("formatFileSize: kilobytes", () => {
  assert.equal(formatFileSize(15 * 1024), "15 KB");
});

test("formatFileSize: megabytes com uma casa decimal", () => {
  assert.equal(formatFileSize(8.2 * 1024 * 1024), "8,2 MB");
});

test("formatFileSize: megabytes redondo sem casa decimal", () => {
  assert.equal(formatFileSize(9 * 1024 * 1024), "9 MB");
});

test("formatFileSize: acima do limite tambem formata (usado na mensagem de erro)", () => {
  assert.equal(formatFileSize(14.7 * 1024 * 1024), "14,7 MB");
});
