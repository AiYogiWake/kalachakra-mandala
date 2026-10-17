// Kalachakra Mandala Palace — data layer
// NOTE: Palace proportions, the five floors, the six elemental disks, the Ashtamatrika names,
// the five Buddha families and the eight Great-Bliss shaktis follow commonly published descriptions.
// The per-shakti bija syllables, descriptive names, dakini / family / planet / nakshatra assignments
// are an ARTISTIC / INTERPRETIVE mapping created for this visualization, not a textual citation.

export const HASTA_FT = 6;

// Five nested palace floors (units = hasta / armspans). y = floor height.
export const LEVELS = [
  { key: 'body',    name: 'Body Mandala',            skt: 'कायमण्डल',     w: 200, y: 0,   top: 100,   color: '#38e8ff', gates: true },
  { key: 'speech',  name: 'Speech Mandala',          skt: 'वाङ्मण्डल',    w: 100, y: 100, top: 150,   color: '#ff4fd8', gates: true },
  { key: 'mind',    name: 'Mind Mandala',            skt: 'चित्तमण्डल',    w: 50,  y: 150, top: 175,   color: '#7c8bff', gates: true },
  { key: 'wisdom',  name: 'Exalted Wisdom Mandala',  skt: 'ज्ञानमण्डल',    w: 25,  y: 175, top: 187.5, color: '#9dff6a', gates: true },
  { key: 'bliss',   name: 'Great Bliss Mandala',     skt: 'महासुखमण्डल', w: 12,  y: 175, top: 200,   color: '#ffd84a', gates: false },
];
export const ROOF_TIP = 200;
export const BINDU_Y = 182;

// Six elemental disks beneath the palace, gross → subtle (top → bottom)
export const DISKS = [
  { key: 'earth', name: 'Earth disk',         skt: 'पृथ्वीमण्डल', shape: 'square',   r: 118, y: -10, color: '#ffc928' },
  { key: 'water', name: 'Water disk',         skt: 'अब्मण्डल',    shape: 'circle',   r: 140, y: -24, color: '#7fd8ff' },
  { key: 'fire',  name: 'Fire disk',          skt: 'तेजोमण्डल',   shape: 'triangle', r: 175, y: -38, color: '#ff4a26' },
  { key: 'wind',  name: 'Wind disk',          skt: 'वायुमण्डल',   shape: 'bow',      r: 185, y: -52, color: '#5fffb0' },
  { key: 'space', name: 'Space disk',         skt: 'आकाशमण्डल',  shape: 'circle',   r: 200, y: -66, color: '#3a46ff' },
  { key: 'consc', name: 'Consciousness disk', skt: 'ज्ञानधातु',    shape: 'circle',   r: 215, y: -80, color: '#e6d6ff' },
];

// Six Yogas completion-stage dissolution navigation
export const STAGES = [
  { n: 0, short: 'Mandala',  title: 'Full Mandala', sign: 'All elements abiding', text: 'The complete palace: five floors, six elemental disks, eight fields and sixty-four shaktis. Choose a stage to dissolve inward.' },
  { n: 1, short: 'Earth → Water', title: 'Earth dissolves into Water', sign: 'Inner sign: mirage', text: 'The square earth disk collapses inward into water. The Body Mandala fades. The body feels heavy and sinking; a shimmering mirage appears.' },
  { n: 2, short: 'Water → Fire', title: 'Water dissolves into Fire', sign: 'Inner sign: smoke', text: 'The water disk draws into fire. The Speech Mandala fades. Fluids dry; wisps of smoke arise.' },
  { n: 3, short: 'Fire → Air', title: 'Fire dissolves into Air', sign: 'Inner sign: fireflies / sparks', text: 'The fire triangle is absorbed into wind. The Mind Mandala fades. Warmth withdraws; sparks like fireflies.' },
  { n: 4, short: 'Air → Space', title: 'Air dissolves into Space', sign: 'Inner sign: flickering butter-lamp', text: 'The wind disk collapses into space. The Exalted Wisdom Mandala fades. Breath ceases; a steady lamp-flame glow.' },
  { n: 5, short: 'Near-attainment', title: 'Space — Near-Attainment (nyer thob)', sign: 'Eclipse-dark black appearance', text: 'Space dissolves; the Great Bliss lotus fades. White appearance and red increase give way to the eclipse-dark near-attainment (Tib. nyer thob), like a moonless night sky.' },
  { n: 6, short: 'Clear Light', title: 'Clear Light', sign: 'Autumn-dawn sky, utterly clear', text: 'The consciousness disk dissolves into the bindu. Only the clear light remains — luminous, vast, without center.' },
  { n: 7, short: 'Emanation', title: 'Emanation Bodies Arise', sign: 'Arising from the bindu', text: 'From the clear light, emanation bodies bloom outward from the bindu in the five family colours, and the palace and fields re-manifest.' },
  { n: 8, short: 'Phowa — release', title: 'Phowa: transference of consciousness', sign: 'Release a soul from the body, physical attachment', text: 'The bindu rises up the central axis, through the roof tip at 200 hasta and beyond. The palace and body dissolve into light, and the water that became a being lets the being go.' },
];
export const BINDU_INTENSITY = [1.0, 1.35, 1.75, 2.2, 2.7, 3.3, 4.0, 4.8, 5.4];

export const FAMILIES = [
  { key: 'buddha', name: 'Buddha family',  buddha: 'Vairocana',     dakini: 'Buddha Ḍākinī', color: '#f4f4ff', dir: 'Center', pos: [0, 0] },
  { key: 'vajra',  name: 'Vajra family',   buddha: 'Akṣobhya',      dakini: 'Vajra Ḍākinī',  color: '#3d7bff', dir: 'East',   pos: [0, 1] },
  { key: 'ratna',  name: 'Ratna family',   buddha: 'Ratnasambhava', dakini: 'Ratna Ḍākinī',  color: '#ffd23a', dir: 'South',  pos: [1, 0] },
  { key: 'padma',  name: 'Padma family',   buddha: 'Amitābha',      dakini: 'Padma Ḍākinī',  color: '#ff3b4e', dir: 'West',   pos: [0, -1] },
  { key: 'karma',  name: 'Karma family',   buddha: 'Amoghasiddhi',  dakini: 'Karma (Viśva) Ḍākinī', color: '#37ff7a', dir: 'North', pos: [-1, 0] },
];
// Interpretive family → planet grouping (nine Kalachakra planets incl. Rāhu & Kālāgni)
export const PLANETS = [
  { name: 'Sun', skt: 'सूर्य', fam: 0, color: '#ffb02e' },
  { name: 'Moon', skt: 'चन्द्र', fam: 0, color: '#e8f0ff' },
  { name: 'Saturn', skt: 'शनि', fam: 1, color: '#6f8cff' },
  { name: 'Rāhu', skt: 'राहु', fam: 1, color: '#8a5cff' },
  { name: 'Jupiter', skt: 'बृहस्पति', fam: 2, color: '#ffe066' },
  { name: 'Venus', skt: 'शुक्र', fam: 3, color: '#ff9ad5' },
  { name: 'Mars', skt: 'मङ्गल', fam: 3, color: '#ff4a3a' },
  { name: 'Mercury', skt: 'बुध', fam: 4, color: '#5dffa0' },
  { name: 'Kālāgni', skt: 'कालाग्नि', fam: 4, color: '#ff6a1a' },
];
export const NAKSHATRAS = ['Aśvinī','Bharaṇī','Kṛttikā','Rohiṇī','Mṛgaśīrṣa','Ārdrā','Punarvasu','Puṣya','Āśleṣā','Maghā','Pūrva Phalgunī','Uttara Phalgunī','Hasta','Citrā','Svātī','Viśākhā','Anurādhā','Jyeṣṭhā','Mūla','Pūrva Āṣāḍhā','Uttara Āṣāḍhā','Abhijit','Śravaṇa','Dhaniṣṭhā','Śatabhiṣā','Pūrva Bhādrapadā','Uttara Bhādrapadā','Revatī'];

// Ashtamatrika — the eight mothers
export const MATRIKAS = [
  { name: 'Brahmāṇī', skt: 'ब्राह्मणी', color: '#ffd76a' },
  { name: 'Māheśvarī', skt: 'माहेश्वरी', color: '#e8f3ff' },
  { name: 'Kaumārī', skt: 'कौमारी', color: '#ff6a3d' },
  { name: 'Vaiṣṇavī', skt: 'वैष्णवी', color: '#4f8dff' },
  { name: 'Cāmuṇḍā', skt: 'चामुण्डा', color: '#b04dff' },
  { name: 'Indrāṇī', skt: 'इन्द्राणी', color: '#5dffd0' },
  { name: 'Vārāhī', skt: 'वाराही', color: '#ff4f8f' },
  { name: 'Mahālakṣmī', skt: 'महालक्ष्मी', color: '#ffb84a' },
];

// Eight shaktis on the lotus of the Great Bliss mandala (names as commonly given)
export const BLISS_SHAKTIS = ['Kṛṣṇadīptā','Raktadīptā','Śvetadīptā','Pītadīptā','Dhūmā','Marīcī','Khadyotā','Pradīpā'];

const VOW = [['', 'a'], ['ा', 'ā'], ['ि', 'i'], ['ी', 'ī'], ['ु', 'u'], ['ू', 'ū'], ['े', 'e'], ['ै', 'ai']];

// Eight elemental fields — a closed, non-hierarchical loop (light → earth)
const F = [
  { key: 'earth',  name: 'Earth',  skt: 'पृथ्वी', c: 'ल', r: 'l',  color: '#ffc928', fam: 2, forms: [
    ['Śilā','stone','stone'],['Asthi','bone','bone'],['Māṃsā','flesh & muscle fibre','flesh'],['Kāyā','the body\'s mass','body'],
    ['Parvatā','mountain','mountain'],['Mūlā','roots','roots'],['Bījā','seed sprouting','seed'],['Sphaṭikā','crystal','crystal']]},
  { key: 'water',  name: 'Water',  skt: 'आपः',   c: 'व', r: 'v',  color: '#4fc3ff', fam: 1, forms: [
    ['Nīhārā','mist','mist'],['Varṣā','rainfall','rain'],['Garbhodakā','amniotic fluid & embryo','amnion'],['Vṛkkā','the kidneys','kidneys'],
    ['Maithunā','sexual union','union'],['Prajananī','procreation — cell division','mitosis'],['Taraṅgā','waves','waves'],['Śīkarā','dew drops','dew']]},
  { key: 'fire',   name: 'Fire',   skt: 'तेजस्',  c: 'र', r: 'r',  color: '#ff5a2a', fam: 3, forms: [
    ['Jvālā','flame','flame'],['Jāṭharā','digestive fire','digestion'],['Sūryā','the sun','sun'],['Ūṣmā','metabolic heat — convection','heat'],
    ['Vidyut','lightning','lightning'],['Sphuliṅgā','rising sparks','sparks'],['Kuṇḍā','fire-pit hearth','kunda'],['Pradīpā','butter lamp','lamp']]},
  { key: 'desire', name: 'Desire', skt: 'काम',   c: 'क्ल', r: 'kl', color: '#ff4fa8', fam: 3, forms: [
    ['Ākarṣaṇī','attraction','attraction'],['Hṛdayā','the heart\'s pull','heart'],['Utkaṇṭhā','longing made visible','longing'],['Padminī','lotus opening','lotus'],
    ['Āliṅganā','embrace','embrace'],['Madhu','nectar drip','nectar'],['Vaśyā','magnetic draw','magnet'],['Kusumā','blossoming branch','blossom']]},
  { key: 'ether',  name: 'Ether',  skt: 'आकाश',  c: 'ह', r: 'h',  color: '#7a7dff', fam: 0, forms: [
    ['Śūnyā','hollow spaces','hollow'],['Nāḍī','the three channels','channels'],['Mauna','silence','silence'],['Cakrā','channel-wheels','chakras'],
    ['Nādā','sound — standing waves','nada'],['Antarikṣā','sky dome','sky'],['Ghaṇṭā','bell resonance','bell'],['Khā','the void torus','torus']]},
  { key: 'mind',   name: 'Mind',   skt: 'मनस्',   c: 'क्ष', r: 'kṣ', color: '#c18cff', fam: 1, forms: [
    ['Cittā','branching web of thought','neurons'],['Ājñā','third-eye oval','thirdEye'],['Candrā','crescent moon & stars','moonStars'],['Svapnā','dream ripples','dream'],
    ['Smṛti','memory knot','knot'],['Prajñā','spiral of insight','galaxy'],['Vikalpā','conceptual proliferation','fractal'],['Maṇḍalā','turning mandala','mandala']]},
  { key: 'air',    name: 'Air',    skt: 'वायु',   c: 'य', r: 'y',  color: '#5fffb0', fam: 4, forms: [
    ['Prāṇā','breath','breath'],['Vātā','wind','wind'],['Phupphusā','the lungs','lungs'],['Gati','movement','movement'],
    ['Āvartā','whirlwind','vortex'],['Śakunā','flock of birds','flock'],['Parṇā','swirling leaves','leaves'],['Spandā','pulse waves','pulse']]},
  { key: 'light',  name: 'Light',  skt: 'प्रकाश', c: 'ह्र', r: 'hr', color: '#fff3c4', fam: 0, forms: [
    ['Prabhā','radiance','radiance'],['Ābhāsā','residual luminosity','afterglow'],['Upalabdhī','near-attainment eclipse','eclipse'],['Prabhāsvarā','clear light','clearLight'],
    ['Indracāpā','rainbow body','rainbow'],['Uṣā','dawn','dawn'],['Jyotiṣmatī','aurora curtains','aurora'],['Tejā','halo rings','halo']]},
];

export const FIELDS = F.map((f, fi) => ({ key: f.key, name: f.name, skt: f.skt, color: f.color, index: fi, famBase: f.fam }));

export const SHAKTIS = [];
F.forEach((f, fi) => {
  f.forms.forEach(([nm, formName, formKey], j) => {
    const bija = f.c + VOW[j][0] + 'ं';
    const iast = f.r + VOW[j][1] + 'ṃ';
    const fam = (f.fam + j) % 5;
    const famPlanets = PLANETS.map((p, i) => [p, i]).filter(([p]) => p.fam === fam);
    const planetIdx = famPlanets[j % famPlanets.length][1];
    const idx = fi * 8 + j;
    SHAKTIS.push({
      idx, field: fi, j, name: nm, formName, form: formKey, bija, iast, fam,
      dakini: `${FAMILIES[fam].dakini}`,
      planet: planetIdx,
      star: (idx * 11 + fi * 3) % 28,
    });
  });
});
// Each field is associated (interpretively) with one of the eight mothers.
FIELDS.forEach((f, i) => { f.matrika = i; });
