export function createPointerLock(
  element: HTMLElement
) {
  return {
    lock() {
      if (
        document.pointerLockElement !==
        element
      ) {
        element.requestPointerLock();
      }
    },

    unlock() {
      if (
        document.pointerLockElement ===
        element
      ) {
        document.exitPointerLock();
      }
    },

    isLocked() {
      return (
        document.pointerLockElement ===
        element
      );
    },
  };
}