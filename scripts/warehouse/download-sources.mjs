#!/usr/bin/env node
/**
 * CW34-S3-F: Source download placeholder.
 * Actual auto-download to be implemented in CW34-S5.
 */

console.log('━━ Source Download ━━\n');
console.log('Currently manual. Place updated files at:\n');
console.log('  EBTI:  /Volumes/soulmaten/POTAL/regulations/eu_ebti/ebti_rulings.csv');
console.log('         (Download from https://ec.europa.eu/taxation_customs/dds2/ebti/)\n');
console.log('  CROSS: /Volumes/soulmaten/POTAL/regulations/us/cross_rulings/batches/*.json');
console.log('         (Download from https://rulings.cbp.gov/)\n');
console.log('  Unified: regenerated from EBTI+CROSS in Silver step.\n');
console.log('Bronze ingest will detect new files via SHA256 hash comparison.');
console.log('If files unchanged, ingest will skip (idempotent).\n');

// TODO CW34-S5: implement auto-download
//   - EBTI: bulk CSV export or SPARQL endpoint
//   - CROSS: rulings.cbp.gov JSON API pagination
