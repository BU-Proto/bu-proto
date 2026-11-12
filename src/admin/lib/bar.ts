import { createContext, useContext } from 'react'

/**
 * The shell's header bar, as a place for the current page to put its heading and buttons. It's a
 * DOM node, filled through a portal (see PageHeader), so the bar stays put while pages scroll
 * under it and each page still owns what it says.
 */
export const BarContext = createContext<HTMLElement | null>(null)

export const useBar = () => useContext(BarContext)
