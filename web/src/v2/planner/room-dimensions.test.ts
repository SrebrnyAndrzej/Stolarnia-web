import test from "node:test";
import assert from "node:assert/strict";
import { newDraft } from "./model";
import {
  convertRoomFields,
  prepareRoomDimensions,
  roomFields,
  roomMillimetres,
} from "./room-dimensions";

test("customer room dimensions accept centimetres with Polish decimals and remain integer millimetres", () => {
  const draft = newDraft();
  const result = prepareRoomDimensions(
    draft,
    { ...roomFields(draft, "cm"), width: "370,5" },
    "cm",
  );
  assert.equal(result.draft?.width, 3705);
  assert.equal(result.draft?.height, 2600);
  assert.deepEqual(result.errors, {});
  for (const bad of ["", " ", "3m", "360cm", "1e3", "360,01", "NaN", "-360"])
    assert.ok(Number.isNaN(roomMillimetres(bad, "cm")), bad);
  assert.equal(roomMillimetres("180.1", "cm"), 1801);
  assert.ok(Number.isNaN(roomMillimetres("1800.5", "mm")));
});

test("unit switching converts every wall exactly once, preserving incomplete input", () => {
  const input = {
    width: "370,5",
    depth: "245",
    returnLength: "",
    height: "260",
  };
  const mm = convertRoomFields(input, "cm", "mm");
  assert.deepEqual(mm, {
    width: "3705",
    depth: "2450",
    returnLength: "",
    height: "2600",
  });
  assert.equal(convertRoomFields(mm, "mm", "cm").width, "370.5");
  assert.equal(convertRoomFields(input, "cm", "cm"), input);
});

test("room depth is editable even for straight kitchens with islands and hidden returns retain canonical values", () => {
  const draft = newDraft();
  const fields = {
    ...roomFields(draft, "cm"),
    height: "200",
    depth: "",
    returnLength: "wrong",
  };
  const blocked = prepareRoomDimensions(draft, fields, "cm");
  assert.equal(blocked.draft, undefined);
  assert.deepEqual(Object.keys(blocked.errors), ["depth", "height"]);
  const valid = prepareRoomDimensions(
    draft,
    { ...fields, height: "260", depth: "450" },
    "cm",
  );
  assert.equal(valid.draft?.depth, 4500);
  assert.equal(valid.draft?.returnLength, draft.returnLength);
  const u = prepareRoomDimensions({ ...draft, layout: "u" }, fields, "cm");
  assert.deepEqual(Object.keys(u.errors), ["depth", "returnLength", "height"]);
});
