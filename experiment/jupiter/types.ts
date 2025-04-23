import type { IdlAccounts, ProgramAccount, IdlTypes } from "@coral-xyz/anchor";
import { Perpetuals } from "./idl/jupiter-perpetuals-idl";

export type Position = IdlAccounts<Perpetuals>["position"];
export type PositionAccount = ProgramAccount<Position>;

export type PositionRequest = IdlAccounts<Perpetuals>["positionRequest"];
export type PositionRequestAccount = ProgramAccount<PositionRequest>;

export type Custody = IdlAccounts<Perpetuals>["custody"];
export type CustodyAccount = ProgramAccount<Custody>;

export type ContractTypes = IdlTypes<Perpetuals>;
export type Pool = IdlAccounts<Perpetuals>["pool"];
export type PoolApr = ContractTypes["PoolApr"];
