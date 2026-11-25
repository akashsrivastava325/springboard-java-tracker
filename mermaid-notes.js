const renderNoteDiagrams = (() => {
  const mermaidModule = 'https://cdn.jsdelivr.net/npm/mermaid@12.3.0/dist/mermaid.esm.min.mjs';
  let library;
  let nextDiagramId = 0;

  function loadMermaid() {
    library ??= import(mermaidModule).then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        suppressErrorRendering: true,
        htmlLabels: false,
        secure: [
          'secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'maxEdges',
          'suppressErrorRendering', 'htmlLabels', 'themeCSS', 'dompurifyConfig'
        ]
      });
      return mermaid;
    });
    return library;
  }

  function showFallback(block, message) {
    if (!block.isConnected) return;
    const status = document.createElement('p');
    status.className = 'mermaid-note-status';
    status.setAttribute('role', 'status');
    status.textContent = message;
    block.before(status);
  }

  async function renderBlock(code) {
    const block = code.parentElement;
    let mermaid;
    try {
      mermaid = await loadMermaid();
    } catch {
      showFallback(block, 'Mermaid couldn’t load. The diagram source is shown below.');
      return;
    }
    if (!block.isConnected) return;

    try {
      const { svg } = await mermaid.render('note-diagram-' + (++nextDiagramId), code.textContent);
      if (!block.isConnected) return;

      // Render SVG in an image context so links and scripts cannot run in the notebook.
      const graphic = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
      const image = new Image();
      image.className = 'mermaid-note';
      image.alt = graphic.querySelector('title')?.textContent.trim() || 'Mermaid diagram';
      const width = Number(graphic.getAttribute('viewBox')?.trim().split(/[\s,]+/)[2]);
      if (Number.isFinite(width) && width > 0) image.width = Math.ceil(width);
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      await image.decode();
      if (block.isConnected) block.replaceWith(image);
    } catch {
      showFallback(block, 'Couldn’t render this Mermaid diagram. Check the syntax below.');
    }
  }

  return root => Promise.all(Array.from(root.querySelectorAll('pre > code.language-mermaid'), renderBlock));
})();
