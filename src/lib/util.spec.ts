import { describe, expect, it } from "vitest";
import { removeChecklist, removeCodeblock, removeComment } from "./util";

describe("removeChecklist", () => {
  it.each([
    ["- [ ] foo", ""],
    ["- [x] foo", ""],
    ["- [ ] foo\n- [x] bar", ""],
    ["- [ ] foo\n  - [x] bar", ""],
    ["# hello world\n- [ ] foo\n", "# hello world\n"],
    ["- [ ] foo\r\n- [x] bar", ""],
    ["\r\n- [ ] This change is not user-facing.\r\n", ""],
  ])("removeChecklist(%j) => %j", (input, expected) => {
    expect(removeChecklist(input)).toBe(expected);
  });
});

describe("removeCodeblock", () => {
  it.each([
    ["```foo```", ""],
    ["```foo```\nbar", "bar"],
  ])("removeCodeblock(%j) => %j", (input, expected) => {
    expect(removeCodeblock(input)).toBe(expected);
  });
});

describe("removeComment", () => {
  it.each([
    ["<!-- foo -->", ""],
    ["<!-- foo -->\nbar", "bar"],
    ["<!-- foo -->\r\nbar", "bar"],
    ["<!-- foo -->\r\nbar\n<!-- baz -->", "bar\n"],
  ])("removeComment(%j) => %j", (input, expected) => {
    expect(removeComment(input)).toBe(expected);
  });
});
