export const SIDES = ['A', 'B', 'C', 'D'];
export function createRecord(demo = false) {
  const name = demo ? 'Slow Sunday' : '未命名唱片';
  return { id: crypto.randomUUID(), name, vinylColor: '#171719', vinylFinish:'opaque', vinylPattern:'solid', vinylAccent:'#f5e9d1', rpm: 33.33, sleeve: { type: 'single', color: '#e5e3df', front: '', back: '', insideLeft: '', insideRight: '' }, labels: Object.fromEntries(SIDES.map(side => [side, { title: name.toUpperCase(), color: '#e9e8e4', image: '' }])), tracks: demo ? [{ id: crypto.randomUUID(), title: 'Slow Sunday', detail: '原創合成音景 · 試聽', source: '/assets/slow-sunday.wav', side: 'A', duration: 24 }] : [] };
}
export const recordSides = record => record.sleeve.type === 'double' ? SIDES : SIDES.slice(0, 2);
export function moveTrack(tracks, from, to) {
  const a = tracks.find(t => t.id === from), b = tracks.find(t => t.id === to);
  if (!a || !b || a.side !== b.side || from === to) return tracks;
  const indices = tracks.flatMap((t, i) => t.side === a.side ? [i] : []);
  const sameSide = indices.map(i => tracks[i]);
  const start = sameSide.findIndex(t => t.id === from), end = sameSide.findIndex(t => t.id === to);
  sameSide.splice(end, 0, sameSide.splice(start, 1)[0]);
  const result = [...tracks]; indices.forEach((i, j) => result[i] = sameSide[j]); return result;
}
export function archiveSnapshot(record) {
  return { ...record, updatedAt: Date.now(), tracks: record.tracks.map(({ url, ...track }) => track) };
}
