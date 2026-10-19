import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from '../lib/monacoBinding.js';
import '../lib/monaco.js';

// MonacoBinding tags remote cursors with per-client classes; we generate the CSS from awareness.
function useRemoteCursorStyles(awareness) {
  useEffect(() => {
    const style = document.createElement('style');
    document.head.appendChild(style);
    const render = () => {
      const css = [];
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID || !state.user) return;
        const color = /^#[0-9a-fA-F]{6}$/.test(state.user.color) ? state.user.color : '#2D54E8';
        const name = String(state.user.name ?? 'Guest').replace(/["'\\\n\r<>]/g, '').slice(0, 30);
        css.push(
          `.yRemoteSelection-${clientId}{background-color:${color}33}`,
          `.yRemoteSelectionHead-${clientId}{position:absolute;border-left:2px solid ${color};height:100%;box-sizing:border-box}`,
          `.yRemoteSelectionHead-${clientId}::after{content:"${name}";position:absolute;top:-1.5em;left:-2px;background:${color};color:#fff;font:500 11px "IBM Plex Sans",sans-serif;padding:1px 6px;border-radius:4px 4px 4px 0;white-space:nowrap;z-index:10}`
        );
      });
      style.textContent = css.join('\n');
    };
    awareness.on('change', render);
    render();
    return () => { awareness.off('change', render); style.remove(); };
  }, [awareness]);
}

export default function CodeEditor({ doc, awareness, language }) {
  const bindingRef = useRef(null);
  useRemoteCursorStyles(awareness);

  useEffect(() => () => { bindingRef.current?.destroy(); bindingRef.current = null; }, [doc]);

  const onMount = (editor) => {
    bindingRef.current = new MonacoBinding(doc.getText('code'), editor.getModel(), new Set([editor]), awareness);
    editor.focus();
  };

  return (
    <Editor
      height="100%"
      theme="vs"
      language={language}
      onMount={onMount}
      loading={<span className="text-ink-soft">Starting editor…</span>}
      options={{
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16 },
        tabSize: 2,
        wordWrap: 'on',
      }}
    />
  );
}
