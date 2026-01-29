(function () {
  // Prevent double initialization
  if (window.__markdownCollapsibleInit) return;
  window.__markdownCollapsibleInit = true;

  const STORAGE_KEY = 'mcs-collapsed-sections';
  const PROCESSED_CLASS = 'mcs-processed';
  const COLLAPSED_CLASS = 'mcs-collapsed';
  const CONTENT_CLASS = 'mcs-content';
  const CHEVRON_CLASS = 'mcs-chevron';

  // Track all collapsible sections for collapse-all feature
  const collapsibleSections = [];

  // Chevron SVG icon
  const CHEVRON_ICON = `<svg class="${CHEVRON_CLASS}" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  /**
   * Generate a unique key for a header based on its text and level
   */
  function getHeaderKey(header) {
    const level = header.tagName.toLowerCase();
    // Exclude chevron from text by getting text without the SVG
    const text = header.textContent.trim().substring(0, 50);
    return `${level}:${text}`;
  }

  /**
   * Get collapsed state from localStorage
   */
  function getCollapsedState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  /**
   * Save collapsed state to localStorage
   */
  function saveCollapsedState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Get the header level as a number (1-6)
   */
  function getHeaderLevel(header) {
    return parseInt(header.tagName.charAt(1), 10);
  }

  /**
   * Collect all content between this header and the next header of same or higher level
   */
  function collectSectionContent(header) {
    const level = getHeaderLevel(header);
    const content = [];
    let sibling = header.nextElementSibling;

    while (sibling) {
      // Stop if we hit a header of same or higher level
      if (/^H[1-6]$/.test(sibling.tagName)) {
        const siblingLevel = getHeaderLevel(sibling);
        if (siblingLevel <= level) {
          break;
        }
      }
      content.push(sibling);
      sibling = sibling.nextElementSibling;
    }

    return content;
  }

  /**
   * Wrap section content in a collapsible container
   */
  function wrapContent(header, content) {
    if (content.length === 0) return null;

    const wrapper = document.createElement('div');
    wrapper.className = CONTENT_CLASS;

    // Insert wrapper after header
    header.after(wrapper);

    // Move content into wrapper
    content.forEach(el => wrapper.appendChild(el));

    return wrapper;
  }

  /**
   * Set collapsed state for a single section (without saving to storage)
   */
  function setCollapsed(header, wrapper, collapsed) {
    if (collapsed) {
      header.classList.add(COLLAPSED_CLASS);
      wrapper.style.display = 'none';
      header.setAttribute('aria-expanded', 'false');
    } else {
      header.classList.remove(COLLAPSED_CLASS);
      wrapper.style.display = '';
      header.setAttribute('aria-expanded', 'true');
    }
  }

  /**
   * Toggle collapsed state for a header
   */
  function toggleCollapsed(header, wrapper) {
    const isCollapsed = header.classList.toggle(COLLAPSED_CLASS);
    
    if (isCollapsed) {
      wrapper.style.display = 'none';
    } else {
      wrapper.style.display = '';
    }

    header.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');

    // Save state
    const state = getCollapsedState();
    const key = getHeaderKey(header);
    if (isCollapsed) {
      state[key] = true;
    } else {
      delete state[key];
    }
    saveCollapsedState(state);
  }

  /**
   * Get all child sections nested within a header's content wrapper
   */
  function getChildSections(wrapper) {
    const childSections = [];
    
    // Find all headers inside this wrapper that are also collapsible
    collapsibleSections.forEach(({ header, wrapper: sectionWrapper }) => {
      if (wrapper.contains(header)) {
        childSections.push({ header, wrapper: sectionWrapper });
      }
    });
    
    return childSections;
  }

  /**
   * Recursively collapse or expand a section and all its children
   */
  function toggleSectionRecursive(header, wrapper, collapse) {
    const state = getCollapsedState();

    // Toggle the clicked section
    setCollapsed(header, wrapper, collapse);
    const key = getHeaderKey(header);
    if (collapse) {
      state[key] = true;
    } else {
      delete state[key];
    }

    // Toggle all child sections recursively
    const childSections = getChildSections(wrapper);
    childSections.forEach(({ header: childHeader, wrapper: childWrapper }) => {
      setCollapsed(childHeader, childWrapper, collapse);
      const childKey = getHeaderKey(childHeader);
      if (collapse) {
        state[childKey] = true;
      } else {
        delete state[childKey];
      }
    });

    saveCollapsedState(state);
  }

  /**
   * Check if this section and most of its children are collapsed
   */
  function isSectionMostlyCollapsed(header, wrapper) {
    const childSections = getChildSections(wrapper);
    const allSections = [{ header, wrapper }, ...childSections];
    
    if (allSections.length === 0) return false;
    
    const collapsedCount = allSections.filter(
      ({ header: h }) => h.classList.contains(COLLAPSED_CLASS)
    ).length;
    
    return collapsedCount > allSections.length / 2;
  }

  /**
   * Process a single header element
   */
  function processHeader(header) {
    // Skip if already processed
    if (header.classList.contains(PROCESSED_CLASS)) return;
    header.classList.add(PROCESSED_CLASS);

    // Collect content for this section
    const content = collectSectionContent(header);
    if (content.length === 0) return;

    // Wrap content in collapsible container
    const wrapper = wrapContent(header, content);
    if (!wrapper) return;

    // Store reference for collapse-all feature
    collapsibleSections.push({ header, wrapper });

    // Create chevron element
    const chevronSpan = document.createElement('span');
    chevronSpan.innerHTML = CHEVRON_ICON;
    chevronSpan.style.marginRight = '8px';
    chevronSpan.style.display = 'inline-flex';
    chevronSpan.style.alignItems = 'center';
    header.insertBefore(chevronSpan, header.firstChild);

    // Make header clickable
    header.style.cursor = 'pointer';
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'true');

    // Restore collapsed state from storage
    const state = getCollapsedState();
    const key = getHeaderKey(header);
    if (state[key]) {
      header.classList.add(COLLAPSED_CLASS);
      wrapper.style.display = 'none';
      header.setAttribute('aria-expanded', 'false');
    }

    // Add click handler
    header.addEventListener('click', (e) => {
      // Don't toggle if clicking on a link or button inside the header
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
      
      e.preventDefault();

      // Cmd+Click (Mac) or Ctrl+Click (Windows/Linux) = collapse/expand this section AND all nested children
      if (e.metaKey || e.ctrlKey) {
        const shouldCollapse = !isSectionMostlyCollapsed(header, wrapper);
        toggleSectionRecursive(header, wrapper, shouldCollapse);
        return;
      }

      toggleCollapsed(header, wrapper);
    });
  }

  /**
   * Process all headers in the document
   */
  function processAllHeaders() {
    // Process headers in order (important for nesting)
    const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headers.forEach(processHeader);
  }

  // Initial processing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processAllHeaders);
  } else {
    processAllHeaders();
  }

  // Watch for dynamic content (preview updates)
  // Note: We need to be careful here as the preview may completely replace content
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any added nodes are headers or contain headers
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (/^H[1-6]$/.test(node.tagName) || node.querySelector?.('h1, h2, h3, h4, h5, h6')) {
              shouldProcess = true;
              break;
            }
          }
        }
      }
      if (shouldProcess) break;
    }
    if (shouldProcess) {
      // Small delay to let the DOM settle
      setTimeout(processAllHeaders, 10);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
