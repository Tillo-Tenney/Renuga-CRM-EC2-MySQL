// Type definitions for MySQL2 query results

// For SELECT queries - returns array of rows
export type SelectResult = any[];

// For INSERT/UPDATE/DELETE queries - returns OkPacket with affectedRows
export type ModifyResult = {
  affectedRows: number;
  insertId: number;
  warningCount: number;
  info: string;
};
