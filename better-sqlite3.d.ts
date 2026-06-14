declare module "better-sqlite3" {
  type BindParameter = string | number | bigint | Buffer | null;

  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement<TReturn = unknown> {
    all(...params: BindParameter[]): TReturn[];
    get(...params: BindParameter[]): TReturn;
    run(...params: BindParameter[]): RunResult;
  }

  interface Database {
    exec(sql: string): this;
    pragma(source: string): unknown;
    prepare<TReturn = unknown>(sql: string): Statement<TReturn>;
    transaction<T extends (...args: never[]) => unknown>(fn: T): T;
  }

  interface Options {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message?: unknown, ...optionalParams: unknown[]) => void;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: Options): Database;
  }

  const Database: DatabaseConstructor;

  export = Database;
}
