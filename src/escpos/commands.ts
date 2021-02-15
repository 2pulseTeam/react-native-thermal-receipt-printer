import { Buffer } from "buffer";

export const EscPosCommands = {

  INIT_PRINTER: Buffer.from([0x1b, 0x40]), // ESC @

  LF: Buffer.from([0x0a]), // LINE_FEED
  CR: Buffer.from([0x0d]), // CARRIAGE_RETURN

  BIT_IMAGE: Buffer.from([0x1b, 0x2a]), // ESC *

  BARCODE: Buffer.from([0x1b, 0x28, 0x42]), // ESC ( B

  PAGE_FORMAT: Buffer.from([0x1b, 0x28, 0x63]), // ESC ( c

  BOLD: Buffer.from([0x1b, 0x45]), // ESC E

  SELECT_ITALIC: Buffer.from([0x1b, 0x34]), // ESC 4
  CANCEL_ITALIC: Buffer.from([0x1b, 0x35]), // ESC 5

  SELECT_DOUBLE_STRIKE: Buffer.from([0x1b, 0x47]), // ESC G
  CANCEL_DOUBLE_STRIKE: Buffer.from([0x1b, 0x48]), // ESC H

  SELECT_BOTTOM_MARGIN: Buffer.from([0x1b, 0x4e]), // ESC N
  CANCEL_BOTTOM_MARGIN: Buffer.from([0x1b, 0x4f]), // ESC 0
  SELECT_RIGHT_MARGIN: Buffer.from([0x1b, 0x51]), // ESC Q

  LINE_SPACING_16: Buffer.from([0x1b, 0x32]), // ESC 2
  LINE_SPACING_N180: Buffer.from([0x1b, 0x33]), // ESC 3
  
  SELECT_JUSTIFICATION: Buffer.from([0x1b, 0x61]), // ESC a 

  CUT: Buffer.from([0x1d, 0x56]), // GS V 

  SELECT_CHARACTER_SIZE: Buffer.from([0x1d, 0x21]), // GS !

  UNDERLINE: Buffer.from([0x1b, 0x7e]), // ESC -

  // ESC ( t
  SELECT_CODE_PAGE: Buffer.from([0x1b, 0x74]), // ESC t

  ABSOLUTE_PRINT_POSITION: Buffer.from([0x1b, 0x24]), // ESC $

  TAB_POSITION: Buffer.from([0x1b, 0x24]), // ESC $
}