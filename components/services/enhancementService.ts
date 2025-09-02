
export const processHtml = (content: string): { enhancedContent: string; logs: string[] } => {
  let processedContent = content;
  const logs: string[] = [];
  
  // 1. CSS Theme Injection
  if (content.includes('<head>') && !content.includes('--main-bg')) {
    const themeStyle = `<style>:root{--main-bg:#8B0000;--main-fg:#fff;--btn-color:#ff00ff;--link-color:#ffff00;}</style>`;
    processedContent = processedContent.replace(/(<head>)/i, `$1\n    ${themeStyle}`);
    logs.push('Injected CSS theme variables.');
  }

  // 2. JS Function Comments
  const funcRegex = /function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*\{(?!\s*\/\*\s*AI:)/g;
  processedContent = processedContent.replace(funcRegex, 'function $1($2) { /* AI: optimize */ ');
  if (funcRegex.test(content)) {
    logs.push('Added "AI: optimize" comments to functions.');
  }

  // 3. Event Listener Monitoring
  const listenerRegex = /\.addEventListener\((['"])(.*?)\1, (.*)\)/g;
  processedContent = processedContent.replace(listenerRegex, '.addEventListener($1$2$1, /* AI: monitored */ $3)');
  if (listenerRegex.test(content)) {
      logs.push('Added "AI: monitored" comments to event listeners.');
  }

  // 4. Semantic HTML: Replace div.section with <section>
  const originalContentForSections = processedContent;
  processedContent = processedContent.replace(/<div([^>]*)>/gi, (match, attributes) => {
    if (/\bclass\s*=\s*(['"])[^\1]*\bsection\b[^\1]*\1/.test(attributes)) {
      return `<section${attributes}>`;
    }
    return match;
  });

  if (originalContentForSections !== processedContent) {
    const sectionEndRegex = /<\/div><!-- \.section -->/g;
    processedContent = processedContent.replace(sectionEndRegex, '</section>');
    logs.push('Replaced div.section with <section> tags.');
  }
  
  // 5. ARIA Roles Injection (if missing)
  const roles: { [key: string]: string } = {
    'nav': 'navigation',
    'header': 'banner',
    'main': 'main',
    'footer': 'contentinfo',
  };

  for (const [tag, role] of Object.entries(roles)) {
    const tagRegex = new RegExp(`<(${tag})([^>]*)>`, 'gi');
    processedContent = processedContent.replace(tagRegex, (match, tagName, attributes) => {
        // Check if a role attribute already exists
        if (!/\srole\s*=\s*['"]/.test(attributes)) {
            logs.push(`Injected role="${role}" into <${tagName}> tag.`);
            return `<${tagName} role="${role}"${attributes}>`;
        }
        return match; // Return original match if role exists
    });
  }

  if(logs.length === 0) {
    logs.push("No applicable enhancements found for this file.");
  }

  return { enhancedContent: processedContent, logs };
};
