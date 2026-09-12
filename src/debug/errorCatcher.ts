const showError = (
  title: string,
  message: string
) => {
  const error = document.createElement('pre');

  error.style.position = 'fixed';
  error.style.left = '10px';
  error.style.right = '10px';
  error.style.top = '10px';
  error.style.zIndex = '99999';
  error.style.margin = '0';
  error.style.padding = '15px';
  error.style.background = '#8b0000';
  error.style.color = '#ffffff';
  error.style.fontFamily = 'monospace';
  error.style.fontSize = '14px';
  error.style.whiteSpace = 'pre-wrap';
  error.style.overflow = 'auto';
  error.style.maxHeight = '90vh';

  error.textContent =
    `${title}\n\n${message}`;

  document.body.appendChild(error);
};

// JavaScript errors
window.addEventListener(
  'error',
  (event) => {
    console.error(
      'Game error:',
      event.error
    );

    showError(
      'GAME ERROR',
      `${event.message}\n\n` +
      `File: ${event.filename}\n` +
      `Line: ${event.lineno}\n` +
      `Column: ${event.colno}`
    );
  }
);

// Unhandled Promise errors
window.addEventListener(
  'unhandledrejection',
  (event) => {
    console.error(
      'Unhandled Promise error:',
      event.reason
    );

    showError(
      'PROMISE ERROR',
      String(event.reason)
    );
  }
);