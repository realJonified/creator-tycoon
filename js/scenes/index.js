// Liste aller Szenen. Neue Szene: Datei in diesem Ordner anlegen und hier eintragen.
import titel from './titel.js';
import tutorial from './tutorial.js';
import haus from './haus.js';
import video from './video.js';
import shop from './shop.js';
import kisten from './kisten.js';
import awards from './awards.js';
import einstellungen from './einstellungen.js';
import bestaetigen from './overlay-bestaetigen.js';
import award from './overlay-award.js';

export const SCENES = [titel, tutorial, haus, video, shop, kisten, awards, einstellungen, bestaetigen, award];
export const START_SCENE = 'titel';
