import * as Y from 'yjs';
import * as monaco from 'monaco-editor';

const ORIGIN = Symbol('monaco-binding');

/**
 * Minimal, correct Yjs <-> Monaco binding.
 *
 * Replaces y-monaco@0.1.6, which (1) restored a pre-edit selection snapshot with
 * editor.setSelection(...) after every transaction, fighting Monaco's own caret
 * tracking (Ctrl+A / caret jumps), and (2) failed to advance the write index on
 * delete operations, so multi-op deltas (paste, undo, IME) landed at wrong offsets.
 *
 * Local edits flow Monaco -> ytext (tagged ORIGIN so remote echoes are skipped).
 * Remote edits flow ytext -> Monaco via applyEdits, letting Monaco adjust the
 * local caret itself instead of overwriting it.
 */
export class MonacoBinding {
  constructor(ytext, monacoModel, editors = [], awareness = null) {
    this.ytext = ytext;
    this.doc = ytext.doc;
    this.monacoModel = monacoModel;
    this.editors = editors;
    this.awareness = awareness;
    this._applyingRemote = false;
    this._decorations = new Map();
    this._disposed = false;

    const current = ytext.toString();
    if (monacoModel.getValue() !== current) {
      this._applyingRemote = true;
      monacoModel.setValue(current);
      this._applyingRemote = false;
    }

    this._onMonacoChange = monacoModel.onDidChangeContent((event) => {
      if (this._applyingRemote) return;
      this.doc.transact(() => {
        const changes = [...event.changes].sort((a, b) => b.rangeOffset - a.rangeOffset);
        for (const change of changes) {
          if (change.rangeLength > 0) ytext.delete(change.rangeOffset, change.rangeLength);
          if (change.text) ytext.insert(change.rangeOffset, change.text);
        }
      }, ORIGIN);
    });

    this._onYtext = (event, transaction) => {
      if (transaction.origin === ORIGIN || this._disposed) return;
      this._applyingRemote = true;
      try {
        const edits = [];
        let index = 0;
        for (const op of event.delta) {
          if (op.retain !== undefined) {
            index += op.retain;
          } else if (op.insert !== undefined) {
            const pos = monacoModel.getPositionAt(index);
            const text = typeof op.insert === 'string' ? op.insert : '';
            edits.push({ range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text });
            index += text.length;
          } else if (op.delete !== undefined) {
            const start = monacoModel.getPositionAt(index);
            const end = monacoModel.getPositionAt(index + op.delete);
            edits.push({ range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column), text: '' });
          }
        }
        if (edits.length) monacoModel.applyEdits(edits);
      } finally {
        this._applyingRemote = false;
      }
      this._renderDecorations();
    };
    ytext.observe(this._onYtext);

    this._onDispose = monacoModel.onWillDispose(() => this.destroy());

    this._selectionHandlers = [];
    if (awareness) {
      for (const editor of editors) {
        const handler = editor.onDidChangeCursorSelection(() => this._broadcastSelection(editor));
        this._selectionHandlers.push({ editor, handler });
      }
      this._onAwarenessChange = () => this._renderDecorations();
      awareness.on('change', this._onAwarenessChange);
    }
  }

  _broadcastSelection(editor) {
    if (editor.getModel() !== this.monacoModel) return;
    const sel = editor.getSelection();
    if (!sel) return;
    let anchor = this.monacoModel.getOffsetAt(sel.getStartPosition());
    let head = this.monacoModel.getOffsetAt(sel.getEndPosition());
    if (sel.getDirection() === monaco.SelectionDirection.RTL) {
      [anchor, head] = [head, anchor];
    }
    this.awareness.setLocalStateField('selection', {
      anchor: Y.createRelativePositionFromTypeIndex(this.ytext, anchor),
      head: Y.createRelativePositionFromTypeIndex(this.ytext, head),
    });
  }

  _renderDecorations() {
    if (!this.awareness || this._disposed) return;
    for (const editor of this.editors) {
      if (editor.getModel() !== this.monacoModel) {
        this._decorations.delete(editor);
        continue;
      }
      const previous = this._decorations.get(editor) || [];
      const next = [];
      this.awareness.getStates().forEach((state, clientId) => {
        if (clientId === this.doc.clientID || !state.selection) return;
        const { anchor, head } = state.selection;
        if (!anchor || !head) return;
        const anchorAbs = Y.createAbsolutePositionFromRelativePosition(anchor, this.doc);
        const headAbs = Y.createAbsolutePositionFromRelativePosition(head, this.doc);
        if (!anchorAbs || !headAbs || anchorAbs.type !== this.ytext || headAbs.type !== this.ytext) return;
        const forward = anchorAbs.index < headAbs.index;
        const [from, to] = forward ? [anchorAbs.index, headAbs.index] : [headAbs.index, anchorAbs.index];
        const start = this.monacoModel.getPositionAt(from);
        const end = this.monacoModel.getPositionAt(to);
        const headClass = `yRemoteSelectionHead yRemoteSelectionHead-${clientId}`;
        next.push({
          range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
          options: {
            className: `yRemoteSelection yRemoteSelection-${clientId}`,
            afterContentClassName: forward ? headClass : null,
            beforeContentClassName: forward ? null : headClass,
          },
        });
      });
      this._decorations.set(editor, editor.deltaDecorations(previous, next));
    }
  }

  destroy() {
    if (this._disposed) return;
    this._disposed = true;
    this._onMonacoChange.dispose();
    this._onDispose.dispose();
    this.ytext.unobserve(this._onYtext);
    this._selectionHandlers.forEach(({ handler }) => handler.dispose());
    this._selectionHandlers = [];
    if (this.awareness && this._onAwarenessChange) {
      this.awareness.off('change', this._onAwarenessChange);
    }
    for (const editor of this.editors) {
      const previous = this._decorations.get(editor) || [];
      editor.deltaDecorations(previous, []);
    }
    this._decorations.clear();
  }
}
