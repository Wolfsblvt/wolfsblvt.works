/**
 * The header's personal navigation. The words are how a person would name the sections; the plain names appear in
 * Wolf's handwriting on hover and focus, in the footer's mini Walk and in the mobile menu.
 */
export interface NavItem {
  id: 'hi' | 'what' | 'why' | 'who' | 'help' | 'whoa' | 'hello';
  word: string;
  plain: string;
}

export const NAV: readonly NavItem[] = [
  { id: 'hi', word: 'Hi', plain: 'Start' },
  { id: 'what', word: 'What', plain: 'Projects' },
  { id: 'why', word: 'Why', plain: 'About Works' },
  { id: 'who', word: 'Who', plain: 'Wolf & agents' },
  { id: 'help', word: 'Help', plain: 'Support the work' },
  { id: 'whoa', word: 'Whoa', plain: 'The Pile' },
  { id: 'hello', word: 'Hello?', plain: 'Contact' },
];
