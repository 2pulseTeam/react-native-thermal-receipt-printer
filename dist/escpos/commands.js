import { Buffer } from "buffer";
export var EscPosCommands = {
    INIT_PRINTER: Buffer.from([0x1b, 0x40]),
    LF: Buffer.from([0x0a]),
    CR: Buffer.from([0x0d]),
    BIT_IMAGE: Buffer.from([0x1b, 0x2a]),
    BARCODE: Buffer.from([0x1b, 0x28, 0x42]),
    PAGE_FORMAT: Buffer.from([0x1b, 0x28, 0x63]),
    BOLD: Buffer.from([0x1b, 0x45]),
    SELECT_ITALIC: Buffer.from([0x1b, 0x34]),
    CANCEL_ITALIC: Buffer.from([0x1b, 0x35]),
    SELECT_DOUBLE_STRIKE: Buffer.from([0x1b, 0x47]),
    CANCEL_DOUBLE_STRIKE: Buffer.from([0x1b, 0x48]),
    SELECT_BOTTOM_MARGIN: Buffer.from([0x1b, 0x4e]),
    CANCEL_BOTTOM_MARGIN: Buffer.from([0x1b, 0x4f]),
    SELECT_RIGHT_MARGIN: Buffer.from([0x1b, 0x51]),
    LINE_SPACING_16: Buffer.from([0x1b, 0x32]),
    LINE_SPACING_N180: Buffer.from([0x1b, 0x33]),
    SELECT_JUSTIFICATION: Buffer.from([0x1b, 0x61]),
    CUT: Buffer.from([0x1d, 0x56]),
    SELECT_CHARACTER_SIZE: Buffer.from([0x1d, 0x21]),
    UNDERLINE: Buffer.from([0x1b, 0x7e]),
    // ESC ( t
    SELECT_CODE_PAGE: Buffer.from([0x1b, 0x74]),
};
