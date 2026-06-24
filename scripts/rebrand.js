const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// Exclude these directories
const EXCLUDE_DIRS = new Set(['node_modules', '.git', '.wrangler']);

// Files to process (by extension or specific names)
const ALLOWED_EXTENSIONS = new Set(['.html', '.js', '.json', '.css', '.md', '.yml']);

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.has(file)) {
        getFiles(fullPath, files);
      }
    } else {
      const ext = path.extname(file);
      if (ALLOWED_EXTENSIONS.has(ext) || file === '_headers') {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function rebrand() {
  const files = getFiles(ROOT_DIR);
  console.log(`Found ${files.length} files to scan and rebrand.`);

  let modifiedCount = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Apply specific replacements first to maintain case correctness

    // 1. Rename classes, namespaces, functions, global variables
    content = content.replace(/KtmyStore/g, 'KtmyStore');
    content = content.replace(/KtmyAPI/g, 'KtmyAPI');
    content = content.replace(/KtmyI18n/g, 'KtmyI18n');
    content = content.replace(/KtmyCharts/g, 'KtmyCharts');
    content = content.replace(/KtmyAnimations/g, 'KtmyAnimations');
    content = content.replace(/KtmySections/g, 'KtmySections');
    content = content.replace(/Ktmy/g, 'Ktmy');

    // 2. Case-insensitive localstorage prefixes, keys, paths, and URLs
    content = content.replace(/ktmy_lang/g, 'ktmy_lang');
    content = content.replace(/ktmy_v/g, 'ktmy_v');
    content = content.replace(/ktmy_/g, 'ktmy_');
    content = content.replace(/ktmy-malaysia/g, 'ktmy-malaysia');
    content = content.replace(/ktmy.my/g, 'ktmy.my');
    
    // 3. GitHub repository links
    content = content.replace(/kamalcr7\/KTMY/g, 'kamalcr7/KTMY');
    content = content.replace(/kamalcr7\/KTMY\.git/g, 'kamalcr7/KTMY.git');

    // 4. Text headers and logos
    content = content.replace(/KTMY/g, 'KTMY');

    // 5. Logo icon flag replacement
    content = content.replace(/<div class="logo-icon">🔑<\/div>/g, '<div class="logo-icon">🔑</div>');
    content = content.replace(/logo-icon">🔑/g, 'logo-icon">🔑');

    // 6. BM translation copyright/brand mentions
    content = content.replace(/KTMY\. Open data, open future\./g, 'KTMY. Open data, open future.');
    content = content.replace(/KTMY\. Data terbuka, masa depan terbuka\./g, 'KTMY. Data terbuka, masa depan terbuka.');

    // 7. About page meaning description
    content = content.replace(
      /KTMY \(meaning "Pulse" in Bahasa Melayu\)/g,
      'KTMY (meaning "Key to Malaysia")'
    );
    content = content.replace(
      /Ktmy \(meaning "Pulse" in Bahasa Melayu\)/g,
      'Ktmy (meaning "Key to Malaysia")'
    );

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Rebranded: ${path.relative(ROOT_DIR, file)}`);
      modifiedCount++;
    }
  }

  console.log(`Rebranding complete! Modified ${modifiedCount} files.`);
}

rebrand();
