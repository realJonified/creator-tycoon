// Liste aller Szenen. Neue Szene: Datei in diesem Ordner anlegen und hier eintragen.
import titel from './titel.js';
import tutorial from './tutorial.js';
import studio from './studio.js';
import shop from './shop.js';
import awards from './awards.js';
import einstellungen from './einstellungen.js';
import bestaetigen from './overlay-bestaetigen.js';
import viral from './overlay-viral.js';

export const SCENES = [titel, tutorial, studio, shop, awards, einstellungen, bestaetigen, viral];
export const START_SCENE = 'titel';
