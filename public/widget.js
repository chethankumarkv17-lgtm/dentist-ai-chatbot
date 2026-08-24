(function() {
  function initWidget() {
    const script = document.currentScript || document.querySelector('script[data-clinic], script[data-widget-id]');
    if (!script) {
      return;
    }
    
    const clinicId = script.getAttribute('data-widget-id') || script.getAttribute('data-clinic');
    if (!clinicId) {
      return;
    }

    // Check if container already exists to avoid duplicate embeds
    if (document.getElementById('dentalai-widget-container')) {
      return;
    }

    const scriptUrl = new URL(script.src, window.location.href);
    const baseUrl = scriptUrl.origin;

    const container = document.createElement('div');
    container.id = 'dentalai-widget-container';
    
    // Base minimized styles (zero reflow, pure composited CSS transitions)
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.width = '70px';
    container.style.height = '70px';
    container.style.zIndex = '2147483647';
    container.style.border = 'none';
    container.style.transition = 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
    container.style.pointerEvents = 'none';
    container.style.willChange = 'width, height';

    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}/widget?id=${clinicId}`;
    iframe.title = "Dental Clinic AI Assistant";
    iframe.loading = "lazy"; // Non-blocking lazy iframe
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.pointerEvents = 'auto';
    iframe.style.borderRadius = '35px';
    iframe.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
    iframe.style.backgroundColor = 'transparent';
    iframe.style.transition = 'border-radius 0.25s ease';
    iframe.style.colorScheme = 'normal';

    container.appendChild(iframe);
    document.body.appendChild(container);

    window.addEventListener('message', (event) => {
      if (event.origin !== baseUrl) return;
      
      if (event.data.type === 'DENTALAI_WIDGET_RESIZE') {
        const { status } = event.data;
        
        if (status === 'open') {
          const isMobile = window.innerWidth <= 600;
          if (isMobile) {
            container.style.bottom = '0';
            container.style.right = '0';
            container.style.width = '100vw';
            container.style.height = '100dvh';
            iframe.style.borderRadius = '0px';
          } else {
            container.style.bottom = '20px';
            container.style.right = '20px';
            container.style.width = '380px';
            container.style.height = '650px';
            iframe.style.borderRadius = '16px';
          }
        } else if (status === 'closed' || status === 'minimized') {
          container.style.bottom = '20px';
          container.style.right = '20px';
          container.style.width = '70px';
          container.style.height = '70px';
          iframe.style.borderRadius = '35px';
        }
      }
    }, { passive: true });
  }

  // Ensure initialization does not block critical rendering path
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget, { once: true });
  } else {
    // Non-blocking initialization
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(initWidget, { timeout: 1000 });
    } else {
      setTimeout(initWidget, 10);
    }
  }
})();
