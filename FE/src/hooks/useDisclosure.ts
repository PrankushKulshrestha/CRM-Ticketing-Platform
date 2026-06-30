
import { useCallback, useState } from "react";

export interface DisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  set: (value: boolean) => void;
}

/**
 * Manage open/close boolean state — useful for modals, drawers, dropdowns.
 *
 * @example
 *   const drawer = useDisclosure();
 *   <Button onClick={drawer.open}>Open</Button>
 *   <Drawer open={drawer.isOpen} onClose={drawer.close} />
 */
export function useDisclosure(initial = false): DisclosureReturn {
  const [isOpen, setIsOpen] = useState(initial);

  const open   = useCallback(() => setIsOpen(true),              []);
  const close  = useCallback(() => setIsOpen(false),             []);
  const toggle = useCallback(() => setIsOpen((v) => !v),         []);
  const set    = useCallback((value: boolean) => setIsOpen(value), []);

  return { isOpen, open, close, toggle, set };
}