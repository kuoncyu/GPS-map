import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.navigator ||= { onLine: true };
const originalFetch = globalThis.fetch;
const readJson = (url) => JSON.parse(fs.readFileSync(path.join(root, String(url).replace(/^\.\//, '')), 'utf8'));
globalThis.fetch = async (url) => {
  try { return { ok: true, status: 200, json: async () => readJson(url) }; }
  catch { return { ok: false, status: 404, json: async () => ({}) }; }
};

const { getState, setState } = await import('../js/state.js');
const { OfflineRouter, routeToDestination } = await import('../js/routing.js');
const { DemoTrafficProvider, TrafficEngine } = await import('../js/traffic.js');
const graph = readJson('./data/routes.json');
const traffic = new TrafficEngine(new DemoTrafficProvider('./data/traffic.json'));
const router = new OfflineRouter('./data/routes.json', traffic);
const results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, status: 'PASS' }); }
  catch (e) { results.push({ name, status: 'FAIL', error: e?.message || String(e) }); }
}

await check('Loads bundled offline graph and demo traffic snapshot', async () => {
  const loaded = await router.load();
  assert.equal(loaded.schema, 'offline-routing-1');
  assert.ok(loaded.nodes.length >= 2);
  await traffic.refresh();
  assert.equal(traffic.isLive, false);
  assert.equal(traffic.events.length, 4);
});
await check('Calculates a route between valid graph endpoints', async () => {
  const a = graph.nodes.find(n => n.id === 'N0');
  const b = graph.nodes.find(n => n.id === 'N3');
  const route = await router.calculate({ origin: a, destination: b, useTraffic: false });
  assert.equal(route.originNode, 'N0');
  assert.equal(route.destinationNode, 'N3');
  assert.ok(route.points.length >= 2);
  assert.ok(route.distance > 0 && route.seconds > 0);
  assert.equal(route.points[0].name, a.name);
  assert.equal(route.points.at(-1).name, b.name);
});
await check('Honors avoid-highway constraint with a feasible alternative', async () => {
  const a = graph.nodes.find(n => n.id === 'N0');
  const b = graph.nodes.find(n => n.id === 'N3');
  const route = await router.calculate({ origin: a, destination: b, avoidHighway: true, useTraffic: false });
  assert.ok(route.edges === undefined || Array.isArray(route.edgeTraffic));
  assert.ok(route.distance > 0);
  assert.ok(route.edgeTraffic.every(e => e.class !== 'HIGHWAY'));
});
await check('Honors toll avoidance', async () => {
  const a = graph.nodes.find(n => n.id === 'N0');
  const b = graph.nodes.find(n => n.id === 'N3');
  const route = await router.calculate({ origin: a, destination: b, avoidToll: true, useTraffic: false });
  assert.ok(route.edgeTraffic.every(e => !e.toll));
});
await check('Waypoint is included in calculated path', async () => {
  const a = graph.nodes.find(n => n.id === 'N0');
  const mid = graph.nodes.find(n => n.id === 'N2');
  const b = graph.nodes.find(n => n.id === 'N7');
  const route = await router.calculate({ origin: a, destination: b, waypoints: [mid], useTraffic: false });
  assert.ok(route.nodeIds.includes('N2'));
});
await check('routeToDestination updates route-ready application state', async () => {
  const a = graph.nodes.find(n => n.id === 'N0');
  const b = graph.nodes.find(n => n.id === 'N4');
  setState({ currentLocation: { lat: a.lat, lng: a.lng }, route: null, destination: null, alternativeRoutes: [], navigationStatus: 'READY' });
  const route = await routeToDestination(router, { lat: b.lat, lng: b.lng, name: b.name }, { useTraffic: false });
  const state = getState();
  assert.equal(state.navigationStatus, 'ROUTE_READY');
  assert.equal(state.destination.name, b.name);
  assert.equal(state.route.id, route.id);
  assert.equal(state.remainingDistance, route.distance);
  assert.equal(state.remainingTime, route.seconds);
  assert.equal(state.alternativeRoutes.length, 1);
});
await check('Rejects route request when destination is missing', async () => {
  await assert.rejects(() => routeToDestination(router, null), /尚未選擇目的地/);
});
await check('Reports impossible route when every edge is blocked', async () => {
  const a = graph.nodes.find(n => n.id === 'N0');
  const b = graph.nodes.find(n => n.id === 'N3');
  const blockedTraffic = { events: [{}], refresh: async () => {}, edgeImpact: () => ({ blocked: true, delaySeconds: Infinity, factor: 0, events: [] }) };
  const blockedRouter = new OfflineRouter('./data/routes.json', blockedTraffic);
  await assert.rejects(() => blockedRouter.calculate({ origin: a, destination: b, useTraffic: true }), /找不到可行離線路線/);
});

const report = {
  batch: 38,
  suite: 'offline-routing-runtime-integration',
  scope: 'Node.js module integration with mocked fetch over bundled offline JSON; no real browser or GPS hardware.',
  browserAutomation: { playwright: false, puppeteer: false, note: 'Neither Playwright nor Puppeteer is installed in this environment.' },
  total: results.length,
  passed: results.filter(r => r.status === 'PASS').length,
  failed: results.filter(r => r.status === 'FAIL').length,
  results
};
fs.writeFileSync(path.join(root, 'tests/batch38-routing-integration-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (originalFetch) globalThis.fetch = originalFetch;
if (report.failed) process.exitCode = 1;
