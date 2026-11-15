// Spielzüge: Funktionen, die den Zustand S verändern. Kein DOM.
import { BALANCE as B } from '../data/balance.js';
import { AWARDS } from '../data/awards.js';
import { GEAR } from '../data/gear.js';
import { HOUSES } from '../data/houses.js';
import { videoOutcome, moneyPerSec, nextGear, nextHouse, houseIndex } from './formulas.js';

export const VERSION = 3;

export function newState(now = Date.now()) {
  return {
    v: VERSION,
    money: 0, gems: B.startGems, subs: 0, views: 0, videos: 0,
    house: 0,
    gear: Object.fromEntries(Object.keys(GEAR).map(k => [k, 0])),
    boards: {}, board: null, parts: {},
    awards: [],
    lastTopic: 'schleim',
    stats: { videos: 0, earned: 0, bestSubs: 0, seconds: 0, crates: 0, perfect: 0, bestVideo: 0 },
    settings: { sound: false, anim: true },
    tutorialDone: false,
    last: now,
  };
}

const clamp = x => (x > B.maxValue ? B.maxValue : x > 0 ? x : 0);

export function earn(S, money, subs = 0, gems = 0) {
  S.money = clamp(S.money + money);
  S.subs = clamp(S.subs + subs);
  S.gems = Math.floor(clamp(S.gems + gems));
  if (money > 0) S.stats.earned = clamp(S.stats.earned + money);
  if (S.subs > S.stats.bestSubs) S.stats.bestSubs = S.subs;
}

export function checkAwards(S) {
  const got = [];
  for (const a of AWARDS) {
    if (S.subs >= a.subs && !S.awards.includes(a.id)) {
      S.awards.push(a.id);
      earn(S, 0, 0, a.gems || 0);
      got.push(a);
    }
  }
  return got;
}

// Ein fertig hochgeladenes Video wird ausgewertet.
export function finishVideo(S, { topic, points, quality }) {
  const out = videoOutcome(S, { points, quality, topic });
  const perfect = quality >= 1;
  const gems = B.gemsPerVideo + (perfect ? B.gemsPerfect : 0);
  earn(S, out.money, out.subs, gems);
  S.views = clamp(S.views + out.views);
  S.videos++;
  S.stats.videos++;
  if (perfect) S.stats.perfect++;
  if (out.views > S.stats.bestVideo) S.stats.bestVideo = out.views;
  S.lastTopic = topic.id;
  const awards = checkAwards(S);
  return { ...out, gems, perfect, awards, points, quality, topic };
}

export function buyGear(S, cat) {
  const item = nextGear(S, cat);
  if (!item || houseIndex(S) < item.house || S.money < item.price) return null;
  S.money -= item.price;
  S.gear[cat] = (S.gear[cat] || 0) + 1;
  return item;
}

export function buyHouse(S) {
  const h = nextHouse(S);
  if (!h || S.money < h.price) return null;
  S.money -= h.price;
  S.house = houseIndex(S) + 1;
  earn(S, 0, 0, B.gemsPerHouse);
  return h;
}

// Ein Zeitschritt: alte Videos bringen Geld.
export function tick(S, dt) {
  earn(S, moneyPerSec(S) * dt);
  S.stats.seconds += dt;
  return checkAwards(S);
}

export function applyOffline(S, seconds) {
  const t = Math.min(Math.max(0, seconds || 0), B.offlineMaxSeconds);
  if (!(t > 0)) return null;
  const money = moneyPerSec(S) * t * B.offlineRate;
  if (!(money > 0)) return null;
  earn(S, money);
  return { seconds: t, money, rate: B.offlineRate, notice: t >= B.offlineNoticeSeconds };
}

export const HOUSE_COUNT = HOUSES.length;
