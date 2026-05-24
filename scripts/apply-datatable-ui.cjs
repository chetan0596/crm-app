/**
 * Bulk update DataTable JSX across pages.
 * Adds: className="modern-datatable", progress spinner, empty state icon.
 */
const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'src', 'pages');
const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.jsx'));

const progressSpinner = `progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>}`;

const emptyState = `noDataComponent={
              <div className="p-5 text-center">
                <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
                <div className="fw-semibold text-secondary mb-1">No data found</div>
                <div className="small text-muted">Try adjusting your filters or check back later</div>
              </div>
            }`;

let updated = 0;

for (const file of files) {
  const fp = path.join(PAGES_DIR, file);
  let src = fs.readFileSync(fp, 'utf-8');

  if (!src.includes('<DataTable')) continue;

  let changed = false;

  // 1. Ensure className="modern-datatable" exists on DataTable
  // Match <DataTable that doesn't already have the class
  if (!src.includes('className="modern-datatable"')) {
    // Replace <DataTable\n  with <DataTable\n  className="modern-datatable"\n
    src = src.replace(/<DataTable\n/g, '<DataTable\n            className="modern-datatable"\n');
    // Also handle <DataTable followed by space and other props on same-ish line
    src = src.replace(/<DataTable(?=\s+)(?!\s+className="modern-datatable")/g, '<DataTable className="modern-datatable"');
    changed = true;
  }

  // 2. Add progressComponent if not present
  if (!src.includes('progressComponent')) {
    // Insert after progressPending=... line
    src = src.replace(
      /(progressPending=\{[^}]+\}\n)/g,
      `$1            ${progressSpinner}\n`
    );
    changed = true;
  }

  // 3. Add noDataComponent if not present
  if (!src.includes('noDataComponent')) {
    // Insert after progressPending/progressComponent block
    src = src.replace(
      /(progressPending=\{[^}]+\}(?:\n\s*progressComponent=\{[^}]+\})?\n)/,
      `$1            ${emptyState}\n`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fp, src, 'utf-8');
    console.log('Updated:', file);
    updated++;
  }
}

console.log(`\n${updated} files updated.`);
