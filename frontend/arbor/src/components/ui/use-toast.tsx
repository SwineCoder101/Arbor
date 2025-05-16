"use client"

type Toast = {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive" | "warning" | "info";
  duration?: number;
  action?: React.ReactNode;
}

/**
 * Simple toast function that creates and displays a toast notification.
 * This works without React context or state by directly manipulating the DOM.
 */
export function useToast() {
  const toast = (props: Toast) => {
    console.log("Toast called with props:", props);
    
    // Create toast element
    const toastEl = document.createElement('div');
    
    // Set base styles
    toastEl.style.position = 'fixed';
    toastEl.style.bottom = '20px';
    toastEl.style.right = '20px';
    toastEl.style.padding = '12px 16px';
    toastEl.style.borderRadius = '6px';
    toastEl.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    toastEl.style.zIndex = '9999';
    toastEl.style.maxWidth = '320px';
    toastEl.style.opacity = '0';
    toastEl.style.transition = 'opacity 0.3s ease-in-out';
    
    // Set variant-specific styles
    switch (props.variant) {
      case "success":
        toastEl.style.backgroundColor = '#f0fdf4';
        toastEl.style.color = '#166534';
        toastEl.style.border = '1px solid #dcfce7';
        break;
      case "destructive":
        toastEl.style.backgroundColor = '#fef2f2';
        toastEl.style.color = '#991b1b';
        toastEl.style.border = '1px solid #fee2e2';
        break;
      case "warning":
        toastEl.style.backgroundColor = '#fffbeb';
        toastEl.style.color = '#92400e';
        toastEl.style.border = '1px solid #fef3c7';
        break;
      case "info":
        toastEl.style.backgroundColor = '#e0f2fe';
        toastEl.style.color = '#0c4a6e';
        toastEl.style.border = '1px solid #bae6fd';
        break;
      default:
        toastEl.style.backgroundColor = '#f5f5f5';
        toastEl.style.color = '#1f2937';
        toastEl.style.border = '1px solid #e5e5e5';
    }
    
    // Create content
    toastEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; position: relative;">
        <div>
          ${props.title ? `<div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">${props.title}</div>` : ''}
          ${props.description ? `<div style="font-size: 12px; opacity: 0.9;">${props.description}</div>` : ''}
        </div>
        <button style="position: absolute; top: -2px; right: -2px; background: transparent; border: none; font-size: 16px; cursor: pointer; opacity: 0.5; padding: 2px;" aria-label="Close">×</button>
      </div>
    `;
    
    // Add action if provided (we'll try to convert React node to string representation)
    if (props.action && typeof props.action === 'object') {
      const actionContainer = document.createElement('div');
      actionContainer.style.marginLeft = 'auto';
      toastEl.appendChild(actionContainer);
    }
    
    // Add to document
    document.body.appendChild(toastEl);
    
    // Animate in
    setTimeout(() => {
      toastEl.style.opacity = '1';
    }, 10);
    
    // Add close button event listener
    const closeButton = toastEl.querySelector('button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        toastEl.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(toastEl)) {
            document.body.removeChild(toastEl);
          }
        }, 300);
      });
    }
    
    // Auto-remove after duration
    setTimeout(() => {
      toastEl.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toastEl)) {
          document.body.removeChild(toastEl);
        }
      }, 300);
    }, props.duration || 5000);
  };
  
  // Return a mock toast API that's compatible with what our components expect
  return {
    toast,
    toasts: []  // Dummy array to maintain API compatibility
  };
}