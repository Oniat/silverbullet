import { collectNodesOfType } from "$sb/lib/tree.ts";
import { editor, index } from "$sb/silverbullet-syscall/mod.ts";
import type {
  CompleteEvent,
  IndexTreeEvent,
  QueryProviderEvent,
} from "$sb/app_event.ts";
import { applyQuery, removeQueries } from "$sb/lib/query.ts";

// Key space
// tag:TAG => true (for completion)

export async function indexTags({ name, tree }: IndexTreeEvent) {
  removeQueries(tree);
  const allTags = new Set<string>();
  collectNodesOfType(tree, "Hashtag").forEach((n) => {
    allTags.add(n.children![0].text!);
  });
  await index.batchSet(
    name,
    [...allTags].map((t) => ({ key: `tag:${t}`, value: t })),
  );
}

export async function tagComplete(completeEvent: CompleteEvent) {
  const match = /#[^#\s]+$/.exec(completeEvent.linePrefix);
  if (!match) {
    return null;
  }
  const tagPrefix = match[0];
  const allTags = await index.queryPrefix(`tag:${tagPrefix}`);
  return {
    from: completeEvent.pos - tagPrefix.length,
    options: allTags.map((tag) => ({
      label: tag.value,
      type: "tag",
    })),
  };
}

type Tag = {
  name: string;
  freq: number;
};

export async function tagProvider({ query }: QueryProviderEvent) {
  const allTags = new Map<string, number>();
  for (const { value } of await index.queryPrefix("tag:")) {
    let currentFreq = allTags.get(value);
    if (!currentFreq) {
      currentFreq = 0;
    }
    allTags.set(value, currentFreq + 1);
  }
  return applyQuery(
    query,
    [...allTags.entries()].map(([name, freq]) => ({
      name,
      freq,
    })),
  );
}
