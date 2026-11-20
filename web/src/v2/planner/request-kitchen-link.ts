/** Only our hash route is returned, never a third party's supplied URL or HTML. */
export function requestKitchenLink(description: string) {
  const match = description.match(
    /#\/kreator-kuchni\?projekt=([a-f0-9-]{36})&klucz=([a-f0-9]{64})(?![a-f0-9])/,
  );
  return match
    ? `#/kreator-kuchni?projekt=${match[1]}&klucz=${match[2]}`
    : null;
}
