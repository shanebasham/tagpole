export function createPointerLock(element: HTMLElement) {
  const isMobile =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;

  return {
    lock() {
      if (isMobile) {
        return;
      }

      if (document.pointerLockElement !== element) {
        element.requestPointerLock();
      }
    },

    unlock() {
      if (document.pointerLockElement === element) {
        document.exitPointerLock();
      }
    },

    isLocked() {
      if (isMobile) {
        return true;
      }

      return document.pointerLockElement === element;
    },
  };
}