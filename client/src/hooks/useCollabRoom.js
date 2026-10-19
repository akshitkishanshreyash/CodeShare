import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { createSocket } from '../lib/socket.js';
import { SocketIOProvider } from '../lib/SocketIOProvider.js';

/** Owns the Y.Doc, awareness, socket and provider for one room. */
export function useCollabRoom(roomId, identity) {
  const [collab, setCollab] = useState(null); // { doc, awareness }
  const [status, setStatus] = useState('connecting');
  const [language, setLanguageState] = useState('javascript');
  const [title, setTitle] = useState('Untitled');
  const [presence, setPresence] = useState(1);
  const [error, setError] = useState(null);
  const providerRef = useRef(null);
  const identityRef = useRef(identity);
  identityRef.current = identity;

  useEffect(() => {
    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    awareness.setLocalStateField('user', identityRef.current);

    const socket = createSocket();
    const provider = new SocketIOProvider({
      socket,
      roomId,
      doc,
      awareness,
      handlers: {
        onStatus: setStatus,
        onError: setError,
        onPresence: setPresence,
        onLanguage: setLanguageState,
        onJoined: (res) => { setLanguageState(res.language); setTitle(res.title); },
      },
    });
    providerRef.current = provider;
    setCollab({ doc, awareness });

    const connectTimer = setTimeout(() => socket.connect(), 0);

    return () => {
      clearTimeout(connectTimer);
      provider.destroy();
      awareness.destroy();
      doc.destroy();
      providerRef.current = null;
      setCollab(null);
    };
  }, [roomId]);

  // Keep cursor name/colour in sync when the user signs in or out.
  useEffect(() => {
    collab?.awareness.setLocalStateField('user', identity);
  }, [collab, identity]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    providerRef.current?.setLanguage(lang);
  };

  return { collab, status, language, setLanguage, title, setTitle, presence, error };
}
