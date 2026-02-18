import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const projectId =
  process.env.FIRESTORE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.PROJECT_ID;
const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';

const app =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp(projectId ? { projectId } : undefined);

export const firestore = getFirestore(app, databaseId);

console.info('[firebase] Firestore initialized', {
  projectId: app.options.projectId ?? projectId ?? '(auto)',
  databaseId,
});
