import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum TrialStatusEnum { active = 0, inactive = 1 }

export type Witnesses<PS> = {
  getPrivateKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  getPrivateTrialTag(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  getHospitalPatientsAggregate(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  createTrial(context: __compactRuntime.CircuitContext<PS>,
              diseaseCode_0: string,
              minAge_0: bigint,
              maxAge_0: bigint,
              minPatientSampleCount_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  cancelTrial(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  trialEnrollment(context: __compactRuntime.CircuitContext<PS>,
                  trialIdHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  isTrialActive(context: __compactRuntime.CircuitContext<PS>,
                trialIdHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type ProvableCircuits<PS> = {
  createTrial(context: __compactRuntime.CircuitContext<PS>,
              diseaseCode_0: string,
              minAge_0: bigint,
              maxAge_0: bigint,
              minPatientSampleCount_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  cancelTrial(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  trialEnrollment(context: __compactRuntime.CircuitContext<PS>,
                  trialIdHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  isTrialActive(context: __compactRuntime.CircuitContext<PS>,
                trialIdHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
  derivePublicKey(privateKey_0: Uint8Array): Uint8Array;
  derivePrivateTrialTag(privateKey_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  createTrial(context: __compactRuntime.CircuitContext<PS>,
              diseaseCode_0: string,
              minAge_0: bigint,
              maxAge_0: bigint,
              minPatientSampleCount_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  cancelTrial(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  trialEnrollment(context: __compactRuntime.CircuitContext<PS>,
                  trialIdHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  isTrialActive(context: __compactRuntime.CircuitContext<PS>,
                trialIdHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  derivePublicKey(context: __compactRuntime.CircuitContext<PS>,
                  privateKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  derivePrivateTrialTag(context: __compactRuntime.CircuitContext<PS>,
                        privateKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly trialCounter: bigint;
  activeTrials: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { diseaseCode: string,
                                 minAge: bigint,
                                 maxAge: bigint,
                                 minPatientSampleCount: bigint,
                                 status: TrialStatusEnum,
                                 enrolledCount: bigint,
                                 researchLabIdHash: Uint8Array,
                                 trialIdHash: Uint8Array
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { diseaseCode: string,
  minAge: bigint,
  maxAge: bigint,
  minPatientSampleCount: bigint,
  status: TrialStatusEnum,
  enrolledCount: bigint,
  researchLabIdHash: Uint8Array,
  trialIdHash: Uint8Array
}]>
  };
  inactiveTrials: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { diseaseCode: string,
                                 minAge: bigint,
                                 maxAge: bigint,
                                 minPatientSampleCount: bigint,
                                 status: TrialStatusEnum,
                                 enrolledCount: bigint,
                                 researchLabIdHash: Uint8Array,
                                 trialIdHash: Uint8Array
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { diseaseCode: string,
  minAge: bigint,
  maxAge: bigint,
  minPatientSampleCount: bigint,
  status: TrialStatusEnum,
  enrolledCount: bigint,
  researchLabIdHash: Uint8Array,
  trialIdHash: Uint8Array
}]>
  };
  trialsEnrollments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): {
      isEmpty(): boolean;
      size(): bigint;
      member(elem_0: Uint8Array): boolean;
      [Symbol.iterator](): Iterator<Uint8Array>
    }
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
