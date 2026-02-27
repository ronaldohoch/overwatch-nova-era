
// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
import { setGlobalOptions } from 'firebase-functions/v2';

// Define a região para todas as functions.
// 'southamerica-east1' corresponde a São Paulo.
setGlobalOptions({ region: 'southamerica-east1' });

export * from './auth/auth.functions';
export * from './times/times.functions';
export * from './torneios/torneios.functions';
export * from './trofeus/trofeus.functions';
export * from './brackets/brackets.functions';
