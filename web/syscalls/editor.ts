import { Editor } from "../editor.tsx";
import { EditorView, Transaction } from "../deps.ts";
import { SysCallMapping } from "../../plugos/system.ts";
import { FilterOption } from "../../common/types.ts";

type SyntaxNode = {
  name: string;
  text: string;
  from: number;
  to: number;
};

function ensureAnchor(expr: any, start: boolean) {
  let _a;
  const { source } = expr;
  const addStart = start && source[0] != "^",
    addEnd = source[source.length - 1] != "$";
  if (!addStart && !addEnd) return expr;
  return new RegExp(
    `${addStart ? "^" : ""}(?:${source})${addEnd ? "$" : ""}`,
    (_a = expr.flags) !== null && _a !== void 0
      ? _a
      : expr.ignoreCase
      ? "i"
      : "",
  );
}

export function editorSyscalls(editor: Editor): SysCallMapping {
  const syscalls: SysCallMapping = {
    "editor.getCurrentPage": (): string => {
      return editor.currentPage!;
    },
    "editor.getText": () => {
      return editor.editorView?.state.sliceDoc();
    },
    "editor.getCursor": (): number => {
      return editor.editorView!.state.selection.main.from;
    },
    "editor.getSelection": (): { from: number; to: number } => {
      return editor.editorView!.state.selection.main;
    },
    "editor.save": () => {
      return editor.save(true);
    },
    "editor.navigate": async (
      _ctx,
      name: string,
      pos: number | string,
      replaceState = false,
      newWindow = false,
    ) => {
      await editor.navigate(name, pos, replaceState, newWindow);
    },
    "editor.reloadPage": async () => {
      await editor.reloadPage();
    },
    "editor.openUrl": (_ctx, url: string) => {
      const win = window.open(url, "_blank");
      if (win) {
        win.focus();
      }
    },
    "editor.flashNotification": (
      _ctx,
      message: string,
      type: "error" | "info" = "info",
    ) => {
      editor.flashNotification(message, type);
    },
    "editor.filterBox": (
      _ctx,
      label: string,
      options: FilterOption[],
      helpText = "",
      placeHolder = "",
    ): Promise<FilterOption | undefined> => {
      return editor.filterBox(label, options, helpText, placeHolder);
    },
    "editor.showPanel": (
      _ctx,
      id: string,
      mode: number,
      html: string,
      script: string,
    ) => {
      editor.viewDispatch({
        type: "show-panel",
        id: id as any,
        config: { html, script, mode },
      });
    },
    "editor.hidePanel": (_ctx, id: string) => {
      editor.viewDispatch({
        type: "hide-panel",
        id: id as any,
      });
    },
    "editor.insertAtPos": (_ctx, text: string, pos: number) => {
      editor.editorView!.dispatch({
        changes: {
          insert: text,
          from: pos,
        },
      });
    },
    "editor.replaceRange": (_ctx, from: number, to: number, text: string) => {
      editor.editorView!.dispatch({
        changes: {
          insert: text,
          from: from,
          to: to,
        },
      });
    },
    "editor.moveCursor": (_ctx, pos: number, center = false) => {
      editor.editorView!.dispatch({
        selection: {
          anchor: pos,
        },
      });
      if (center) {
        editor.editorView!.dispatch({
          effects: [
            EditorView.scrollIntoView(
              pos,
              {
                y: "center",
              },
            ),
          ],
        });
      }
    },
    "editor.setSelection": (_ctx, from: number, to: number) => {
      const editorView = editor.editorView!;
      editorView.dispatch({
        selection: {
          anchor: from,
          head: to,
        },
      });
    },

    "editor.insertAtCursor": (_ctx, text: string) => {
      const editorView = editor.editorView!;
      const from = editorView.state.selection.main.from;
      editorView.dispatch({
        changes: {
          insert: text,
          from: from,
        },
        selection: {
          anchor: from + text.length,
        },
      });
    },
    "editor.dispatch": (_ctx, change: Transaction) => {
      editor.editorView!.dispatch(change);
    },
    "editor.prompt": (
      _ctx,
      message: string,
      defaultValue = "",
    ): string | null => {
      return prompt(message, defaultValue);
    },
    "editor.confirm": (
      _ctx,
      message: string,
    ): boolean => {
      return confirm(message);
    },
    "editor.enableReadOnlyMode": (_ctx, enabled: boolean) => {
      editor.viewDispatch({
        type: "set-editor-ro",
        enabled,
      });
    },
    "editor.getVimEnabled": (): boolean => {
      return editor.viewState.vimMode;
    },
    "editor.setVimEnabled": (_ctx, enabled: boolean) => {
      editor.setVimMode(enabled);
    },
  };

  return syscalls;
}
