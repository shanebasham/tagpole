export interface PointerLock {
  lock(): void;
  unlock(): void;
  isLocked(): boolean;

  onUnexpectedUnlock(
    listener: () => void
  ): () => void;
}

export function createPointerLock(
  element: HTMLElement
): PointerLock {

  const isMobile =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;

  let wasLocked =
    false;

  let suppressNextUnlock =
    false;

  const listeners =
    new Set<() => void>();

  const handlePointerLockChange =
    (): void => {

      const locked =
        document.pointerLockElement ===
        element;

      /*
       * Pointer Lock was active and is now
       * gone.
       *
       * If unlock() caused it, ignore it.
       * Otherwise, the browser most likely
       * released it because the user pressed
       * Escape.
       */
      if (
        wasLocked &&
        !locked
      ) {

        if (
          suppressNextUnlock
        ) {

          suppressNextUnlock =
            false;

        } else {

          listeners.forEach(
            (listener) => {
              listener();
            }
          );
        }
      }

      wasLocked =
        locked;
    };

  document.addEventListener(
    'pointerlockchange',
    handlePointerLockChange
  );

  return {

    lock(): void {

      if (isMobile) {
        return;
      }

      if (
        document.pointerLockElement ===
        element
      ) {
        return;
      }

      element
        .requestPointerLock()
        .catch(() => {
          /*
           * Pointer lock requires a valid
           * user gesture.
           */
        });
    },

    unlock(): void {

      if (
        document.pointerLockElement ===
        element
      ) {

        /*
         * This is an intentional unlock from
         * the game, not Escape.
         */
        suppressNextUnlock =
          true;

        document.exitPointerLock();
      }
    },

    isLocked(): boolean {

      if (isMobile) {
        return true;
      }

      return (
        document.pointerLockElement ===
        element
      );
    },

    onUnexpectedUnlock(
      listener: () => void
    ): () => void {

      listeners.add(
        listener
      );

      return () => {
        listeners.delete(
          listener
        );
      };
    },
  };
}