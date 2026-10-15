import { firestore } from '../firebase';

const DEFAULT_LOGO_BUCKET = 'copa-nova-era-overwatch.firebasestorage.app';

export interface PublicTeamInfo {
  readonly name: string;
  readonly logoUrl: string | null;
}

/**
 * Gera a URL pública de acesso à logo a partir do logoPath armazenado no Firestore.
 * Suporta: gs:// URI, URL HTTPS completa, e caminho relativo.
 * Respeita FIREBASE_STORAGE_EMULATOR_HOST quando rodando localmente.
 */
export function buildLogoUrl(
  logoPath: string | null | undefined,
  logoBucketName: string | null | undefined,
): string | null {
  if (!logoPath || typeof logoPath !== 'string') return null;
  const path = logoPath.trim();
  if (!path) return null;

  // Já é uma URL completa
  if (path.startsWith('https://') || path.startsWith('http://')) {
    return path.includes('?alt=media') ? path : `${path}?alt=media`;
  }

  let bucket: string;
  let objectPath: string;

  // gs:// URI → extrai bucket e objectPath
  if (path.startsWith('gs://')) {
    const withoutScheme = path.slice('gs://'.length);
    const slashIndex = withoutScheme.indexOf('/');
    if (slashIndex <= 0) return null;
    bucket = withoutScheme.slice(0, slashIndex);
    objectPath = withoutScheme.slice(slashIndex + 1).replace(/^\/+/, '');
    if (!objectPath) return null;
  } else {
    // Caminho relativo — usa bucket do time ou padrão
    bucket =
      typeof logoBucketName === 'string' && logoBucketName.trim()
        ? logoBucketName.trim()
        : DEFAULT_LOGO_BUCKET;
    objectPath = path;
  }

  // Emulador local
  const emulatorHost = process.env['FIREBASE_STORAGE_EMULATOR_HOST'];
  if (emulatorHost) {
    const baseHost =
      emulatorHost.startsWith('http://') || emulatorHost.startsWith('https://')
        ? emulatorHost
        : `http://${emulatorHost}`;
    return `${baseHost}/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
  }

  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
}

/**
 * Nome e logo públicos dos times, lidos da coleção global `teams`.
 * Permite que clientes sem autenticação exibam os times de chaves e grupos.
 */
export async function loadPublicTeamInfo(teamIds: readonly string[]): Promise<Record<string, PublicTeamInfo>> {
  const uniqueIds = [...new Set(teamIds.filter((id) => !!id))];
  const teamInfo: Record<string, PublicTeamInfo> = {};
  if (uniqueIds.length === 0) return teamInfo;

  const teamSnaps = await Promise.all(
    uniqueIds.map((id) => firestore.collection('teams').doc(id).get()),
  );
  for (const snap of teamSnaps) {
    if (!snap.exists) continue;
    const data = snap.data() as Record<string, unknown>;
    const name = typeof data?.name === 'string' ? data.name.trim() : 'Time sem nome';
    const logoPath = typeof data?.logoPath === 'string' ? data.logoPath : null;
    const logoBucketName =
      typeof data?.logoBucketName === 'string' ? data.logoBucketName :
      typeof data?.logoBucket === 'string' ? data.logoBucket : null;
    teamInfo[snap.id] = { name, logoUrl: buildLogoUrl(logoPath, logoBucketName) };
  }

  return teamInfo;
}
