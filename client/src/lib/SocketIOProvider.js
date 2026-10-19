import * as Y from 'yjs';
import { applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';

/**
 * Minimal Yjs provider over Socket.IO.
 * - doc updates   -> 'yjs:update'
 * - cursor state  -> 'awareness:update'
 * - on (re)connect it joins the room, merges the server state and pushes any offline edits.
 */
export class SocketIOProvider {
  constructor({ socket, roomId, doc, awareness, handlers = {} }) {
    this.socket = socket;
    this.roomId = roomId;
    this.doc = doc;
    this.awareness = awareness;
    this.handlers = handlers;

    this.onDocUpdate = (update, origin) => {
      if (origin !== this) socket.emit('yjs:update', { update });
    };
    this.onAwarenessUpdate = ({ added, updated, removed }, origin) => {
      if (origin === this) return;
      socket.emit('awareness:update', { update: encodeAwarenessUpdate(awareness, [...added, ...updated, ...removed]) });
    };
    this.onRemoteDoc = ({ update }) => Y.applyUpdate(doc, new Uint8Array(update), this);
    this.onRemoteAwareness = ({ update }) => applyAwarenessUpdate(awareness, new Uint8Array(update), this);
    this.onAwarenessRequest = () => this.sendLocalAwareness();
    this.onConnect = () => this.join();
    this.onDisconnect = () => {
      handlers.onStatus?.('disconnected');
      const remote = [...awareness.getStates().keys()].filter((id) => id !== doc.clientID);
      removeAwarenessStates(awareness, remote, this);
    };
    this.onConnectError = (err) => {
      if (err?.message) console.warn('socket connect error:', err.message);
      handlers.onStatus?.('disconnected');
    };
    this.onPresence = ({ count }) => handlers.onPresence?.(count);
    this.onLanguage = ({ language }) => handlers.onLanguage?.(language);
    this.onUnload = () => removeAwarenessStates(awareness, [doc.clientID], 'unload');

    doc.on('update', this.onDocUpdate);
    awareness.on('update', this.onAwarenessUpdate);
    socket.on('yjs:update', this.onRemoteDoc);
    socket.on('awareness:update', this.onRemoteAwareness);
    socket.on('awareness:request', this.onAwarenessRequest);
    socket.on('connect', this.onConnect);
    socket.on('disconnect', this.onDisconnect);
    socket.on('connect_error', this.onConnectError);
    socket.on('room:presence', this.onPresence);
    socket.on('room:language', this.onLanguage);
    window.addEventListener('beforeunload', this.onUnload);

    if (socket.connected) this.join();
  }

  sendLocalAwareness() {
    if (this.awareness.getLocalState() === null) return;
    this.socket.emit('awareness:update', { update: encodeAwarenessUpdate(this.awareness, [this.doc.clientID]) });
  }

  join() {
    this.handlers.onStatus?.('connecting');
    this.socket.emit('room:join', { roomId: this.roomId }, (res) => {
      if (!res?.ok) {
        this.handlers.onStatus?.('error');
        this.handlers.onError?.(res?.error ?? 'JOIN_FAILED');
        return;
      }
      Y.applyUpdate(this.doc, new Uint8Array(res.state), this); // server -> client
      this.socket.emit('yjs:update', { update: Y.encodeStateAsUpdate(this.doc) }); // client -> server (offline edits)
      this.sendLocalAwareness();
      this.handlers.onJoined?.(res);
      this.handlers.onStatus?.('connected');
    });
  }

  setLanguage(language) {
    this.socket.emit('room:language', { language });
  }

  destroy() {
    window.removeEventListener('beforeunload', this.onUnload);
    this.doc.off('update', this.onDocUpdate);
    this.awareness.off('update', this.onAwarenessUpdate);
    const s = this.socket;
    s.off('yjs:update', this.onRemoteDoc);
    s.off('awareness:update', this.onRemoteAwareness);
    s.off('awareness:request', this.onAwarenessRequest);
    s.off('connect', this.onConnect);
    s.off('disconnect', this.onDisconnect);
    s.off('connect_error', this.onConnectError);
    s.off('room:presence', this.onPresence);
    s.off('room:language', this.onLanguage);
    s.disconnect();
  }
}
