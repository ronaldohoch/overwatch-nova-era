import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

admin.initializeApp();
export const firestore = isEmulator ? getFirestore() : getFirestore('banco-br');