import fs from 'fs';
import path from 'path';

function buildSingleHtml() {
  const distDir = path.resolve('dist');
  const assetsDir = path.join(distDir, 'assets');

  if (!fs.existsSync(assetsDir)) {
    console.error('dist/assets not found. Please run npm run build first.');
    process.exit(1);
  }

  const files = fs.readdirSync(assetsDir);
  const cssFile = files.find(f => f.endsWith('.css'));
  const jsFile = files.find(f => f.endsWith('.js') && !f.endsWith('.map'));

  if (!cssFile || !jsFile) {
    console.error('CSS or JS asset file not found in dist/assets');
    process.exit(1);
  }

  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');
  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8');

  // Escape any accidental </script> sequence inside jsContent just in case
  const safeJsContent = jsContent.replace(/<\/script/gi, '<\\/script');

  const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hexnode IdP — Directory Integration</title>
    <meta name="description" content="Connect and manage your directory services like Entra ID, Google Workspace, Okta, and Custom Directories with AI-powered migration." />
    <meta property="og:title" content="Hexnode IdP — Directory Integration" />
    <meta property="og:description" content="Connect and manage your directory services like Entra ID, Google Workspace, Okta, and Custom Directories with AI-powered migration." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
/* Hexnode IdP Design System Styles */
${cssContent}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
/* Hexnode IdP Single-File Bundle */
${safeJsContent}
    </script>
  </body>
</html>
`;

  // Output to root hexnode-idp.html
  const rootTarget = path.resolve('hexnode-idp.html');
  fs.writeFileSync(rootTarget, htmlContent, 'utf-8');
  console.log(`Successfully generated standalone HTML: ${rootTarget} (${(htmlContent.length / 1024).toFixed(1)} KB)`);

  // Also output to public/hexnode-idp.html so it can be viewed at /hexnode-idp.html in browser
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicTarget = path.join(publicDir, 'hexnode-idp.html');
  fs.writeFileSync(publicTarget, htmlContent, 'utf-8');
  console.log(`Successfully synced to public: ${publicTarget}`);
}

buildSingleHtml();
