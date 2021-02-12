export const EscPosCommands = {

  INIT_PRINTER: [0x1b, 0x40], // ESC @

  LF: [0x0a], // LINE_FEED
  CR: [0x0d], // CARRIAGE_RETURN

  BIT_IMAGE: [0x1b, 0x2a], // ESC *

  BARCODE: [0x1b, 0x28, 0x42], // ESC ( B

  PAGE_FORMAT: [0x1b, 0x28, 0x63], // ESC ( c

  BOLD: [0x1b, 0x45], // ESC E

  SELECT_ITALIC: [0x1b, 0x34], // ESC 4
  CANCEL_ITALIC: [0x1b, 0x35], // ESC 5

  SELECT_DOUBLE_STRIKE: [0x1b, 0x47], // ESC G
  CANCEL_DOUBLE_STRIKE: [0x1b, 0x48], // ESC H

  SELECT_BOTTOM_MARGIN: [0x1b, 0x4e], // ESC N
  CANCEL_BOTTOM_MARGIN: [0x1b, 0x4f], // ESC 0
  SELECT_RIGHT_MARGIN: [0x1b, 0x51], // ESC Q

  LINE_SPACING_16: [0x1b, 0x32], // ESC 2
  LINE_SPACING_N180: [0x1b, 0x33], // ESC 3
  
  SELECT_JUSTIFICATION: [0x1b, 0x61], // ESC a 

  CUT: [0x1d, 0x56], // GS V 

  SELECT_CHARACTER_SIZE: [0x1d, 0x21], // GS !

  UNDERLINE: [0x1b, 0x7e], // ESC -

  // ESC ( t
  SELECT_CODE_PAGE: [0x1b, 0x74], // ESC t 
}