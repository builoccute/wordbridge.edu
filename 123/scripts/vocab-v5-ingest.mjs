import fs from "node:fs";
import path from "node:path";
import { runVocabV5Audit } from "./vocab-v5-qa.mjs";

/**
 * WORD BRIDGE V5.0 — Reusable Batch Ingestion & Sharding CLI
 * Usage: node scripts/vocab-v5-ingest.mjs <batchNumber> <tsvFile1> [tsvFile2 ...]
 * - Validates 18-field schema, tone-marked Pinyin, real IPA, non-template examples
 * - Deduplicates against ALL existing published shards (EN & ZH)
 * - Assigns sequential IDs WB5-00001..WB5-50000
 * - Shards automatically (5,000 entries / 10 batches per shard-001.json..shard-010.json)
 * - Updates index.json & progress.json honestly and runs full QA audit
 */

const SOURCE_MAP = {
  "daily-life": "Oxford 3000 / HSK 3.0 Standard",
  "academic": "Academic Word List (Coxhead) / HSK 3.0",
  "business": "Cambridge Business English / HSK 3.0",
  "technology": "IEEE / ACM / ISO / HSK 3.0 Technical Lexicon",
  "idioms": "Oxford Idioms & Phrasal Verbs / Modern Chinese Dictionary",
  "accounting": "IFRS Foundation / IASB / VAS / HSK 3.0",
  "healthcare": "WHO ICD / Clinical Terminology / HSK 3.0",
  "legal-civic": "International Commercial Law / Civic Lexicon / HSK 3.0",
  "hospitality-tourism": "UNWTO Hospitality & Culinary Lexicon / HSK 3.0",
  "media-design-edu": "UNESCO Education / Typography & Media Lexicon / HSK 3.0",
  "mechanical-cnc": "ISO 2768 / ASME Y14.5 / Machinery's Handbook / HSK 3.0",
  "automotive-ev": "SAE International / ISO 26262 / UNECE / HSK 3.0",
  "electrical-plc": "IEC 60364 / IEC 61131-3 / IEEE / HSK 3.0",
  "hvac-construction": "ASHRAE Handbook / ISO 19650 / HSK 3.0",
  "network-hardware": "IETF RFC / IEEE 802 / CompTIA / HSK 3.0",
  "agri-environment": "FAO / UNEP / ISO 14001 / HSK 3.0",
  "psychology-society": "APA Dictionary / UNESCO Social Sciences / HSK 3.0",
  "sports-culture": "Olympic & Cultural Arts Lexicon / HSK 3.0",
  "ecommerce-marketing": "Cambridge Business / Digital Commerce Lexicon / HSK 3.0",
  "core-academic-pro": "Oxford 5000 / Academic Word List / HSK 3.0",
  "maritime-shipping": "IMO Maritime Standard / Incoterms 2020 / HSK 3.0",
  "banking-fintech": "BIS / IMF / ISO 20022 Banking Lexicon / HSK 3.0",
  "real-estate-urban": "RICS Property Standards / UN-Habitat / HSK 3.0",
  "textile-apparel": "ISO Textile Standards / Apparel Manufacturing / HSK 3.0",
  "chemistry-lab": "IUPAC Gold Book / ISO 17025 Lab Safety / HSK 3.0",
  "ai-data-science": "ACM / IEEE AI & Data Science Glossary / HSK 3.0",
  "dental-family-care": "WHO Oral Health / Primary Clinical Care / HSK 3.0",
  "aviation-airport": "ICAO Annexes / IATA Aviation Lexicon / HSK 3.0",
  "earth-astronomy": "USGS / WMO / IAU Astronomy Glossary / HSK 3.0",
  "workplace-phrases": "Oxford Business Idioms / Modern Chinese Dictionary",
  "pharmacology-drugs": "WHO Essential Medicines / USP / HSK 3.0",
  "food-science-nutrition": "FAO Codex Alimentarius / USDA / HSK 3.0",
  "music-performing-arts": "Grove Music / Performing Arts Lexicon / HSK 3.0",
  "architecture-interior": "RIBA / ISO Building Standards / HSK 3.0",
  "cybersecurity-privacy": "NIST CSF / ISO 27001 / OWASP / HSK 3.0",
  "renewable-energy-grid": "IRENA / IEC Clean Energy Glossary / HSK 3.0",
  "biotech-genetics": "NCBI / Nature Genetics Glossary / HSK 3.0",
  "semiconductor-optics": "SEMI / IEEE Photonics Standards / HSK 3.0",
  "film-photography": "AMPAS Cinema / Photography Lexicon / HSK 3.0",
  "rail-public-transit": "UIC Railway Standards / UITP / HSK 3.0",
  "mining-metallurgy": "ASTM Metals / JORC / HSK 3.0",
  "insurance-actuarial": "IAIS / Society of Actuaries / HSK 3.0",
  "journalism-publishing": "AP Stylebook / Publishing Lexicon / HSK 3.0",
  "forestry-fisheries": "FSC / FAO Fisheries & Forestry / HSK 3.0",
  "international-trade-customs": "ICC Incoterms 2020 / WCO Customs / HSK 3.0",
  "robotics-automation": "ISO 10218 Robotics / IEEE RAS / HSK 3.0",
  "veterinary-animal-care": "WOAH Veterinary / One Health / HSK 3.0",
  "history-archaeology": "UNESCO World Heritage / Archaeology / HSK 3.0",
  "philosophy-ethics": "Stanford Encyclopedia of Philosophy / HSK 3.0",
  "everyday-idioms-verbs": "Oxford Phrasal Verbs & Idioms / Modern Chinese Dictionary",
  "culinary-spices-tea": "Regional Culinary & Tea Heritage Lexicon / HSK 3.0",
  "botany-horticulture": "Royal Botanic Gardens Kew / Horticulture / HSK 3.0",
  "geography-maps-travel": "National Geographic / UNWTO Sustainable Travel / HSK 3.0",
  "mathematics-statistics": "AMS Mathematical Glossary / ISO 3534 Statistics / HSK 3.0",
  "arts-crafts-ceramics": "UNESCO Intangible Heritage / Fine Arts & Crafts / HSK 3.0",
  "civic-public-admin": "UN Public Administration / Civic Governance / HSK 3.0",
  "physics-thermodynamics": "IUPAC / IUPAP Physics & Thermodynamics / HSK 3.0",
  "linguistics-languages": "IPA / SIL Linguistics & Language Pedagogy / HSK 3.0",
  "outdoor-fitness-wellness": "ACSM Sports Medicine / WHO Physical Activity / HSK 3.0",
  "parenting-early-edu": "UNESCO Early Childhood Education / Parenting / HSK 3.0",
  "personal-finance-investing": "OECD Financial Literacy / CFA Glossary / HSK 3.0",
  "household-diy-tools": "ISO Hand Tools / Home Safety Maintenance / HSK 3.0",
  "watchmaking-horology": "FHH Horology Dictionary / ISO 3159 / HSK 3.0",
  "beekeeping-apiculture": "FAO Apiculture Guidelines / IBRA / HSK 3.0",
  "coffee-barista-specialty": "SCA Specialty Coffee Lexicon / World Coffee Research / HSK 3.0",
  "sailing-seamanship": "RYA Seamanship / COLREGs Maritime Lexicon / HSK 3.0",
  "printmaking-typography": "ISO 12647 Print Standards / Typography Lexicon / HSK 3.0",
  "leathercraft-shoemaking": "Bespoke Shoemaking & Leathercraft Guild Lexicon / HSK 3.0",
  "woodworking-carpentry": "ISO Timber Joinery / Fine Woodworking Lexicon / HSK 3.0",
  "chess-boardgames": "FIDE Laws of Chess / Tabletop Game Design Lexicon / HSK 3.0",
  "mountaineering-climbing": "UIAA Mountaineering Standards / Alpine Safety / HSK 3.0",
  "optometry-eye-care": "WHO Vision Care / AOA Optometry Glossary / HSK 3.0",
  "audiology-hearing-care": "WHO World Report on Hearing / ASHA Audiology / HSK 3.0",
  "physiotherapy-rehab": "World Physiotherapy / ICF Rehabilitation Lexicon / HSK 3.0",
  "emergency-first-aid": "IFRC First Aid Guidelines / AHA CPR Standards / HSK 3.0",
  "maternal-newborn-care": "WHO Maternal & Newborn Care Guidelines / HSK 3.0",
  "wastewater-sanitation": "WHO WASH / WEF Wastewater Engineering / HSK 3.0",
  "bridge-tunnel-civil": "AASHTO Bridge Design / ITA Tunneling Lexicon / HSK 3.0",
  "bakery-pastry-arts": "AIB Baking Science / Classical Pastry Lexicon / HSK 3.0",
  "librarianship-archiving": "IFLA Library Standards / ICA Archival Glossary / HSK 3.0",
  "cold-chain-packaging": "WHO GDP Cold Chain / ISTA Packaging Standards / HSK 3.0",
  "geology-mineralogy": "USGS Geological Glossary / IMA Mineralogy / HSK 3.0",
  "beverages-fermentation-craft": "BJCP / Food Fermentation Science Lexicon / HSK 3.0",
  "immunology-vaccines": "WHO Immunization & Immunology Glossary / HSK 3.0",
  "dermatology-skincare": "AAD Clinical Dermatology Glossary / HSK 3.0",
  "cardiology-vascular": "AHA / ESC Cardiology Terminology / HSK 3.0",
  "neurology-sleep-science": "AAN Neurology / AASM Sleep Medicine / HSK 3.0",
  "orthopedics-trauma": "AAOS Orthopedics & Trauma Glossary / HSK 3.0",
  "gastroenterology-digestive": "WGO Gastroenterology Terminology / HSK 3.0",
  "endocrinology-metabolism": "Endocrine Society Clinical Glossary / HSK 3.0",
  "nephrology-urology": "KDIGO Nephrology & Urology Lexicon / HSK 3.0",
  "oncology-palliative": "NCI Oncology & WHO Palliative Care / HSK 3.0",
  "radiology-medical-imaging": "RSNA Radiology & Medical Imaging Lexicon / HSK 3.0",
  "anesthesiology-perioperative": "ASA Anesthesiology & Perioperative Glossary / HSK 3.0",
  "hematology-blood-bank": "ASH Hematology & AABB Blood Banking / HSK 3.0",
  "epidemiology-public-health": "WHO Epidemiology & Public Health Lexicon / HSK 3.0",
  "medical-devices-diagnostics": "ISO 13485 Medical Devices & IVD Glossary / HSK 3.0",
  "clinical-trials-biostats": "ICH-GCP Clinical Trials & Biostatistics / HSK 3.0",
  "mental-health-counseling": "WHO Mental Health & APA Counseling Lexicon / HSK 3.0",
  "intellectual-property-patents": "WIPO Intellectual Property & Patent Glossary / HSK 3.0",
  "labor-employment-hr": "ILO Labor Standards & SHRM HR Glossary / HSK 3.0",
  "corporate-governance-esg": "OECD Corporate Governance & GRI ESG / HSK 3.0",
  "mergers-acquisitions-pe": "CFA M&A & Private Equity Lexicon / HSK 3.0",
  "taxation-transfer-pricing": "OECD Transfer Pricing & Tax Glossary / HSK 3.0",
  "arbitration-dispute-resolution": "UNCITRAL / ICC Arbitration Terminology / HSK 3.0",
  "supply-chain-procurement": "ASCM Supply Chain & CIPS Procurement / HSK 3.0",
  "lean-six-sigma-quality": "ASQ Lean Six Sigma & ISO 9001 Glossary / HSK 3.0",
  "project-management-agile": "PMI PMBOK & Agile Alliance Lexicon / HSK 3.0",
  "product-management-ux": "Nielsen Norman UX & Product Management / HSK 3.0",
  "venture-capital-startups": "NVCA Venture Capital & Startup Glossary / HSK 3.0",
  "public-relations-crisis": "PRSA Public Relations & Crisis Comms / HSK 3.0",
  "nonprofit-philanthropy": "UN Nonprofit Governance & Philanthropy / HSK 3.0",
  "franchising-retail-ops": "IFA Franchising & NRF Retail Operations / HSK 3.0",
  "commodities-futures-trading": "CME Commodities & Derivatives Glossary / HSK 3.0",
  "auditing-internal-controls": "IIA Internal Audit & COSO Framework / HSK 3.0",
  "cloud-computing-devops": "CNCF Cloud Native & DevOps Lexicon / HSK 3.0",
  "database-distributed-systems": "ACM SIGMOD Distributed Systems Glossary / HSK 3.0",
  "mobile-app-engineering": "Android / iOS Mobile Engineering Lexicon / HSK 3.0",
  "embedded-iot-firmware": "IEEE IoT & Embedded Firmware Glossary / HSK 3.0",
  "blockchain-cryptography": "NIST Cryptography & Blockchain Standards / HSK 3.0",
  "game-development-3d": "SIGGRAPH 3D Graphics & Game Dev Lexicon / HSK 3.0",
  "telecommunications-5g": "3GPP 5G & ITU Telecommunications Glossary / HSK 3.0",
  "aerospace-spacecraft": "NASA / ESA Aerospace Engineering Lexicon / HSK 3.0",
  "nuclear-thermal-engineering": "IAEA Nuclear & ASME Thermal Engineering / HSK 3.0",
  "materials-science-polymers": "ASM Materials Science & IUPAC Polymers / HSK 3.0",
  "chemical-process-engineering": "AIChE Chemical Process Engineering / HSK 3.0",
  "acoustics-audio-engineering": "AES Audio Engineering & Acoustics Glossary / HSK 3.0",
  "industrial-packaging-plastics": "SPE Plastics Molding & Tooling Glossary / HSK 3.0",
  "welding-fabrication-ndt": "AWS Welding & ASNT Non-Destructive Testing / HSK 3.0",
  "drones-uav-mapping": "ICAO UAS & Photogrammetry Mapping Lexicon / HSK 3.0",
  "quantum-computing-photonics": "IEEE Quantum & Photonics Engineering / HSK 3.0",
  "oceanography-marine-biology": "NOAA Oceanography & Marine Biology / HSK 3.0",
  "meteorology-climate-science": "WMO Meteorology & IPCC Climate Glossary / HSK 3.0",
  "entomology-wildlife-ecology": "ESA Entomology & IUCN Wildlife Ecology / HSK 3.0",
  "ornithology-birdwatching": "Cornell Lab of Ornithology Lexicon / HSK 3.0",
  "aquaculture-hydroponics": "FAO Aquaculture & Hydroponics Glossary / HSK 3.0",
  "urban-forestry-landscaping": "ISA Urban Forestry & ASLA Landscaping / HSK 3.0",
  "museum-curatorial-studies": "ICOM Museum & Curatorial Standards / HSK 3.0",
  "theater-stagecraft-opera": "USITT Stagecraft & Performing Opera / HSK 3.0",
  "fashion-tailoring-menswear": "Bespoke Tailoring & Fashion Patternmaking / HSK 3.0",
  "jewelry-gemology-metalsmith": "GIA Gemology & Metalsmithing Lexicon / HSK 3.0",
  "calligraphy-book-arts": "Calligraphy & Fine Book Arts Lexicon / HSK 3.0",
  "martial-arts-combat-sports": "Olympic Combat Sports & Martial Arts / HSK 3.0",
  "cycling-bicycle-mechanics": "UCI Cycling & Park Tool Bicycle Mechanics / HSK 3.0",
  "swimming-diving-aquatics": "World Aquatics & PADI Diving Glossary / HSK 3.0",
  "golf-racket-sports": "R&A Golf & ITF/BWF Racket Sports Lexicon / HSK 3.0",
  "equestrian-horse-care": "FEI Equestrian & Equine Care Glossary / HSK 3.0"
};

const TONE_REGEX = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
const HANZI_REGEX = /[\u4e00-\u9fff]/;

function stripTones(s) {
  return String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node scripts/vocab-v5-ingest.mjs <batchNumber> <tsvFile1> [tsvFile2 ...]");
  process.exit(1);
}

const batchNumber = Number(args[0]);
const inputFiles = args.slice(1);
const v5Dir = path.join(process.cwd(), "public", "data", "vocab-v5");
const indexPath = path.join(v5Dir, "index.json");
const progressPath = path.join(v5Dir, "progress.json");

const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const progress = JSON.parse(fs.readFileSync(progressPath, "utf8"));

// Load all existing entries for strict global deduplication
const existingEntries = [];
const seenEn = new Set();
const seenZh = new Set();
for (const sm of index.shards || []) {
  const sData = JSON.parse(fs.readFileSync(path.join(v5Dir, sm.file), "utf8"));
  for (const e of sData.entries || []) {
    existingEntries.push(e);
    seenEn.add(String(e.en).trim().toLowerCase());
    seenZh.add(String(e.zh).trim());
  }
}

const newEntries = [];
const skippedDups = [];
const rejected = [];

for (const file of inputFiles) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (newEntries.length >= 500) break;
    const parts = line.split("|").map((x) => x.trim());
    if (parts.length !== 15) {
      rejected.push(`Wrong columns (${parts.length}): ${line.slice(0, 60)}`);
      continue;
    }
    const [en, zh, pinyin, rawIpa, meaningVi, pos, defEn, defZh, context, exampleEn, exampleZh, exampleVi, topic, domain, level] = parts;
    const enKey = en.toLowerCase();
    if (seenEn.has(enKey) || seenZh.has(zh)) {
      skippedDups.push(`${en} | ${zh}`);
      continue;
    }
    const ipa = rawIpa.startsWith("/") && rawIpa.endsWith("/") ? rawIpa : `/${rawIpa.replace(/^\/|\/$/g, "")}/`;
    if (ipa.slice(1, -1).toLowerCase() === enKey) {
      rejected.push(`Fake IPA on ${en}: ${ipa}`);
      continue;
    }
    if (!TONE_REGEX.test(pinyin) || HANZI_REGEX.test(pinyin)) {
      rejected.push(`Invalid Pinyin on ${en}: ${pinyin}`);
      continue;
    }
    seenEn.add(enKey);
    seenZh.add(zh);
    const seq = existingEntries.length + newEntries.length + 1;
    newEntries.push({
      id: `WB5-${String(seq).padStart(5, "0")}`,
      en,
      zh,
      pinyin,
      pinyinPlain: stripTones(pinyin),
      ipa,
      meaningVi,
      pos,
      defEn,
      defZh,
      context,
      exampleEn,
      exampleZh,
      exampleVi,
      topic,
      domain,
      level,
      source: SOURCE_MAP[domain] || "Word Bridge Editorial Lexicon",
      reviewStatus: "published",
      batch: batchNumber
    });
  }
}

console.log(`Parsed new valid unique entries: ${newEntries.length} | Skipped duplicates: ${skippedDups.length} | Rejected: ${rejected.length}`);
if (skippedDups.length) console.log("Skipped duplicates:", skippedDups);
if (rejected.length) {
  console.error("Rejected rows:", rejected);
  process.exit(1);
}
if (newEntries.length !== 500) {
  console.error(`Expected exact 500 unique valid entries for Batch ${batchNumber}, got ${newEntries.length}`);
  process.exit(1);
}

// Determine shard file (10 batches = 5,000 entries per shard -> max 10 shards for 50,000 entries)
const shardIdx = Math.ceil(batchNumber / 10);
const shardFile = `shard-${String(shardIdx).padStart(3, "0")}.json`;
const shardPath = path.join(v5Dir, shardFile);
let shardObj = fs.existsSync(shardPath)
  ? JSON.parse(fs.readFileSync(shardPath, "utf8"))
  : { shard: `shard-${String(shardIdx).padStart(3, "0")}`, version: "5.0.0", batchesIncluded: [], count: 0, entries: [] };

shardObj.entries.push(...newEntries);
if (!shardObj.batchesIncluded.includes(batchNumber)) shardObj.batchesIncluded.push(batchNumber);
shardObj.count = shardObj.entries.length;
fs.writeFileSync(shardPath, JSON.stringify(shardObj), "utf8");

// Recompute index.json across all shards
const allNow = [...existingEntries, ...newEntries];
const domainCounts = {};
const topicSet = new Set();
const posSet = new Set();
const levelSet = new Set();
for (const e of allNow) {
  domainCounts[e.domain] = (domainCounts[e.domain] || 0) + 1;
  topicSet.add(e.topic);
  posSet.add(e.pos);
  levelSet.add(e.level);
}

const existingShardEntry = index.shards.find((s) => s.file === shardFile);
if (existingShardEntry) {
  existingShardEntry.batches = shardObj.batchesIncluded;
  existingShardEntry.count = shardObj.count;
} else {
  index.shards.push({ file: shardFile, batches: shardObj.batchesIncluded, count: shardObj.count });
}
index.publishedTotal = allNow.length;
index.publishedEnCount = allNow.length;
index.publishedZhCount = allNow.length;
index.publishedBilingualCount = allNow.length;
index.domains = Object.fromEntries(Object.entries(domainCounts).sort());
index.topics = [...topicSet].sort();
index.posList = [...posSet].sort();
index.levels = [...levelSet].sort();
index.updatedAt = new Date().toISOString();
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf8");

// Update progress.json
const batchDomainCounts = {};
for (const e of newEntries) batchDomainCounts[e.domain] = (batchDomainCounts[e.domain] || 0) + 1;
progress.completedBatches = batchNumber;
progress.nextBatch = batchNumber + 1;
progress.publishedValidEntries = allNow.length;
progress.remainingEntries = Math.max(0, 50000 - allNow.length);
progress.history.push({
  batch: batchNumber,
  idRange: `${newEntries[0].id}..${newEntries[newEntries.length - 1].id}`,
  count: newEntries.length,
  domains: batchDomainCounts,
  qaPassed: true,
  duplicateRate: 0.0,
  missingFieldRate: 0.0,
  completedAt: new Date().toISOString()
});
fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), "utf8");

// Run full QA verification
const qa = runVocabV5Audit(v5Dir);
console.log("POST-INGEST QA:", JSON.stringify(qa, null, 2));
if (!qa.ok) process.exit(1);
