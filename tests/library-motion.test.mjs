import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { createRecord } from '../src/records.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
}
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let reduced = false;
window.matchMedia = () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} });

const calls = [];
Element.prototype.animate = function(frames, options) {
  let resolve, reject;
  const call = { node: this, frames, options, state: 'running', finished: new Promise((yes, no) => { resolve = yes; reject = no; }) };
  call.finish = () => { if (call.state === 'running') { call.state = 'finished'; resolve(); } };
  call.cancel = () => { if (call.state === 'running') reject(new dom.window.DOMException('Cancelled', 'AbortError')); call.state = 'cancelled'; };
  calls.push(call);
  return call;
};

await build({ entryPoints: ['src/LibraryStage.jsx'], bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external', outfile: 'node_modules/.cache/library-motion-test.mjs' });
const React = await import('react');
const { render, screen, fireEvent, cleanup, act } = await import('@testing-library/react');
const { LibraryStage } = await import('../node_modules/.cache/library-motion-test.mjs');
const records = ['First', 'Second', 'Third'].map(name => ({ ...createRecord(), name }));
const props = { record: records[0], library: records, active: true, playing: true, side: 'A', resetKey: 0 };
const finish = () => act(async () => { calls.filter(a => a.state === 'running').forEach(a => a.finish()); await Promise.resolve(); });

test('rapid selections cancel old transitions and retain the latest record', async () => {
  calls.length = 0;
  function Library() {
    const [record, onSelect] = React.useState(records[0]);
    return React.createElement(LibraryStage, { ...props, record, onSelect });
  }
  try {
    render(React.createElement(Library));
    const first = screen.getByRole('button', { name: '展示唱片 First' });
    assert.equal(first.getAttribute('aria-pressed'), 'true');
    fireEvent.click(screen.getByRole('button', { name: '展示唱片 Second' }));
    assert.equal(first.getAttribute('aria-pressed'), 'false');
    const interrupted = calls.filter(a => a.state === 'running');
    fireEvent.click(screen.getByRole('button', { name: '展示唱片 Third' }));
    assert.ok(interrupted.every(a => a.state === 'cancelled'));
    assert.equal(screen.getByRole('button', { name: '展示唱片 Second' }).getAttribute('aria-pressed'), 'false');
    assert.equal(screen.getByRole('button', { name: '展示唱片 Third' }).getAttribute('aria-pressed'), 'true');
    await finish();
    assert.equal(document.querySelector('.library-presentation').dataset.motion, 'idle');
    assert.equal(document.querySelector('.library-caption h1').textContent, 'Third');
    assert.equal(document.querySelector('.library-disc-spin').style.animationPlayState, 'running');
  } finally { cleanup(); }
});

test('resize and navigation settle transitions, and reselecting the current record does not replay them', async () => {
  calls.length = 0;
  try {
    const ui = render(React.createElement(LibraryStage, props));
    fireEvent(window, new Event('resize'));
    assert.ok(calls.every(a => a.state === 'cancelled'));
    const count = calls.length;
    fireEvent.click(screen.getByRole('button', { name: '展示唱片 First' }));
    assert.equal(calls.length, count);
    ui.rerender(React.createElement(LibraryStage, { ...props, record: records[1] }));
    assert.ok(calls.some(a => a.state === 'running'));
    ui.rerender(React.createElement(LibraryStage, { ...props, record: records[1], active: false }));
    assert.equal(document.querySelector('.library-presentation').dataset.motion, 'idle');
    assert.ok(calls.every(a => a.state === 'cancelled'));
    await act(async () => {});
  } finally { cleanup(); }
});

test('reduced motion uses the final pose and still allows sleeve flipping', () => {
  calls.length = 0; reduced = true;
  try {
    const ui = render(React.createElement(LibraryStage, props));
    assert.equal(calls.length, 0);
    fireEvent.click(screen.getByRole('button', { name: '翻到背面，現在為 A 面' }));
    assert.ok(screen.getByRole('button', { name: '翻到正面，現在為 B 面' }));
    ui.rerender(React.createElement(LibraryStage, { ...props, active: false }));
    ui.rerender(React.createElement(LibraryStage, props));
    assert.ok(screen.getByRole('button', { name: '翻到正面，現在為 B 面' }));
    assert.equal(document.querySelector('.library-disc-spin').style.animationPlayState, 'running');
  } finally { cleanup(); reduced = false; }
});
