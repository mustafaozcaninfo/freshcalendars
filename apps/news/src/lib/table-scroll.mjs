/**
 * Wraps every Markdown table in a scroll box. A table that is wider than the column scrolls inside
 * it at any width, instead of being clipped by the page (seen at 1024 px with the sidebar) or
 * squeezed to a word per line on phones. tabindex lets keyboard users scroll it.
 */
export function rehypeTableScroll() {
  const wrap = (node) => {
    node.children?.forEach((child, i) => {
      if (child.type === "element" && child.tagName === "table") {
        node.children[i] = { type: "element", tagName: "figure", properties: { className: ["table-scroll"], tabIndex: 0 }, children: [child] };
      } else wrap(child);
    });
  };
  return (tree) => wrap(tree);
}
