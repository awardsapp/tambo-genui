import { Provider, Scope } from "@nestjs/common";
import { getDb } from "@workspace-cloud/db";

export const DATABASE = Symbol("DATABASE");
export const DatabaseProvider: Provider = {
  provide: DATABASE,
  scope: Scope.REQUEST,
  useFactory: () => getDb(process.env.DATABASE_URL!),
};
