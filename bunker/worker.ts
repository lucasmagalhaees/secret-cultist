/* D159: the bunker's server on Cloudflare (the truco's room server, adapted): a Worker that serves the page (assets) and
   sends each room code to its own Durable Object. All the rules are the core's; room.ts says who sees what. */
import { DurableObject } from 'cloudflare:workers';
import { CONN_MAX, MSG_MAX, handle, isCode, newRoom, readMsg, readRoom, seatView } from './room';
import type { Room as RoomState } from './room';
import { enterBunker } from './key';

interface Env { ROOMS: DurableObjectNamespace<Room>; ASSETS: Fetcher }
interface Tag { code: string; token: string | null; ok: boolean }
const IDLE_FORGET = 24 * 60 * 60e3;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url), m = url.pathname.match(/^\/salas\/([A-Z0-9]+)$/);
    if (!m) return env.ASSETS.fetch(req);
    if (!isCode(m[1])) return new Response('sala não encontrada', { status: 404 });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('a sala só fala por WebSocket', { status: 426 });
    return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
  }
};

export class Room extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const code = new URL(req.url).pathname.split('/').pop() as string;
    if (this.ctx.getWebSockets().length >= CONN_MAX) return new Response('sala cheia', { status: 429 });
    const pair = new WebSocketPair(), [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ code, token: null, ok: false } satisfies Tag);
    await this.ctx.storage.setAlarm(Date.now() + IDLE_FORGET);
    return new Response(null, { status: 101, webSocket: client });
  }
  private async load(code: string): Promise<RoomState> { return readRoom(await this.ctx.storage.get('room')) ?? newRoom(code); }
  private tell(room: RoomState): void {
    for (const ws of this.ctx.getWebSockets()) {
      const tag = ws.deserializeAttachment() as Tag, v = tag.token ? seatView(room, tag.token) : null;
      if (v) try { ws.send(JSON.stringify(v)); } catch { /* gone; its close follows */ }
    }
  }
  private async run(ws: WebSocket, tag: Tag, raw: string): Promise<void> {
    const msg = readMsg(raw);
    if (!msg) { ws.send(JSON.stringify({ t: 'error', why: 'Mensagem desconhecida.' })); return; }
    if (msg.t === 'join') {
      tag.ok = tag.ok || await enterBunker(String(msg.pw || ''));
      if (tag.ok) tag.token = String(msg.token || '').slice(0, 64) || null;
      ws.serializeAttachment(tag);
    }
    if (!tag.token) { ws.send(JSON.stringify({ t: 'error', why: tag.ok ? 'Entre na sala primeiro.' : 'Senha errada.' })); return; }
    const room = await this.load(tag.code), out = handle(room, tag.token, msg, Math.random, tag.ok);
    if (out.error) ws.send(JSON.stringify({ t: 'error', why: out.error }));
    if (out.room === room) { const v = seatView(room, tag.token); if (v) ws.send(JSON.stringify(v)); return; }
    await this.ctx.storage.put('room', out.room);
    await this.ctx.storage.setAlarm(Date.now() + IDLE_FORGET);
    this.tell(out.room);
  }
  async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const raw = typeof data === 'string' ? data : new TextDecoder().decode(data);
    if (raw.length > MSG_MAX) { ws.close(1009, 'mensagem grande demais'); return; }
    await this.run(ws, ws.deserializeAttachment() as Tag, raw);
  }
  async webSocketClose(ws: WebSocket): Promise<void> {
    const tag = ws.deserializeAttachment() as Tag;
    if (!tag.token || this.ctx.getWebSockets().some(o => o !== ws && (o.deserializeAttachment() as Tag).token === tag.token)) return;
    const room = await this.load(tag.code), out = handle(room, tag.token, { t: 'drop' }, Math.random, tag.ok);
    if (out.room === room) return;
    await this.ctx.storage.put('room', out.room);
    this.tell(out.room);
  }
  async webSocketError(ws: WebSocket): Promise<void> { await this.webSocketClose(ws); }
  async alarm(): Promise<void> {
    if (!this.ctx.getWebSockets().length) await this.ctx.storage.deleteAll();
    else await this.ctx.storage.setAlarm(Date.now() + IDLE_FORGET);
  }
}
