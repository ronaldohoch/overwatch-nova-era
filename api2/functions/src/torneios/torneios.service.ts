import { FieldValue } from 'firebase-admin/firestore';
import { firestore } from '../firebase';
import { grantAutomaticTrophiesForEvent } from '../trofeus/trofeus.service';
import { CreateTorneioDto } from './dto/create-torneio.dto';
import { UpdateTorneioDto } from './dto/update-torneio.dto';
import { CheckinDto, Role } from './dto/checkin.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { TournamentStatus } from './dto/set-status.dto';

type TeamMode = 'random' | 'closed';

type RoleSlots = { tank: number; dps: number; support: number };
type CheckinRoleFilter = Role | 'all';
type RoleAvailability = {
  total: number;
  checkedIn: number;
  available: number;
};
type RandomCheckinAvailabilityByRole = {
  tournamentId: string;
  totals: {
    total: number;
    checkedIn: number;
    available: number;
  };
  roles: {
    tank: RoleAvailability;
    dps: RoleAvailability;
    support: RoleAvailability;
  };
};

const ROSTER_MAX_PER_TEAM = 8;

export class TorneiosService {
  private torneiosCollection = firestore.collection('tournaments');
  private globalTeamsCollection = firestore.collection('teams');

  private participantsCol(tournamentId: string) {
    return this.torneiosCollection.doc(tournamentId).collection('participants');
  }

  private teamsCol(tournamentId: string) {
    return this.torneiosCollection.doc(tournamentId).collection('teams');
  }

  private globalTeamMembersCol(teamId: string) {
    return this.globalTeamsCollection.doc(teamId).collection('members');
  }

  // ---------- helpers ----------
  private isEven(n: number) {
    return Number.isInteger(n) && n % 2 === 0;
  }

  private isPowerOfTwo(n: number) {
    return Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;
  }

  private parseIsoDate(iso: any, field: string): Date {
    const d = new Date(String(iso));
    if (Number.isNaN(d.getTime())) throw new Error(`Campo ${field} inválido (use ISO date)`);
    return d;
  }

  private normalizeRole(role: any): Role {
    const r = String(role || '').trim().toLowerCase();
    if (r === 'tank' || r === 'dps' || r === 'support') return r;
    throw new Error(`Role inválida: ${role}`);
  }

  private toNonNegativeInt(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.floor(parsed);
  }

  private defaultRoleSlotsPerTeam(): RoleSlots {
    // teu exemplo base
    return { tank: 2, support: 3, dps: 3 };
  }

  private assertRoleSlotsPerTeam(slots: RoleSlots) {
    for (const [k, v] of Object.entries(slots)) {
      if (!Number.isInteger(v) || v < 0) throw new Error(`roleSlotsPerTeam.${k} deve ser inteiro >= 0`);
    }
    const sum = slots.tank + slots.dps + slots.support;
    if (sum !== ROSTER_MAX_PER_TEAM) {
      throw new Error(`roleSlotsPerTeam deve somar ${ROSTER_MAX_PER_TEAM} (somou ${sum})`);
    }
  }

  private computeRoleSlotsTotal(maxTeams: number, perTeam: RoleSlots): RoleSlots {
    return {
      tank: maxTeams * perTeam.tank,
      dps: maxTeams * perTeam.dps,
      support: maxTeams * perTeam.support,
    };
  }

  private assertStatusTransition(from: TournamentStatus, to: TournamentStatus) {
    const allowed: Record<TournamentStatus, TournamentStatus[]> = {
      draft: ['published', 'canceled'],
      published: ['checkin', 'canceled'],
      checkin: ['locked', 'canceled'],
      locked: ['running', 'canceled'],
      running: ['finished', 'canceled'],
      finished: [],
      canceled: [],
    };

    if (!(allowed[from] || []).includes(to)) {
      throw new Error(`Transição de status inválida: ${from} -> ${to}`);
    }
  }

  private async getUserProfile(uid: string) {
    // opcional: se você mantém /users/{uid}
    const snap = await firestore.collection('users').doc(uid).get();
    return snap.exists ? snap.data() : null;
  }

  // ---------- CRUD torneio ----------
  async create(dto: CreateTorneioDto, createdByUid: string) {
    const name = String(dto?.name || '').trim();
    if (!name) throw new Error('name é obrigatório');

    const teamMode = String(dto?.teamMode || '').trim() as TeamMode;
    if (teamMode !== 'random' && teamMode !== 'closed') throw new Error('teamMode deve ser random|closed');

    const maxTeams = Number(dto?.maxTeams);
    if (!Number.isInteger(maxTeams) || maxTeams <= 0) throw new Error('maxTeams deve ser inteiro > 0');
    if (!this.isEven(maxTeams)) throw new Error('maxTeams deve ser par (ex: 4, 8, 16...)');
    if (!this.isPowerOfTwo(maxTeams)) throw new Error('maxTeams deve ser potência de 2 (ex: 4, 8, 16...)');

    const startAtDate = this.parseIsoDate(dto.startAt, 'startAt');
    const checkinDeadlineDate = this.parseIsoDate(dto.checkinDeadlineAt, 'checkinDeadlineAt');
    if (checkinDeadlineDate.getTime() >= startAtDate.getTime()) {
      throw new Error('checkinDeadlineAt deve ser antes de startAt');
    }

    const description = dto.description == null ? null : String(dto.description).trim();
    if (description && description.length > 240) throw new Error('description no máximo 240 caracteres');

    const base: any = {
      name,
      description,
      format: 'double_elimination',
      teamMode,
      maxTeams,

      startAt: startAtDate.toISOString(),
      checkinDeadlineAt: checkinDeadlineDate.toISOString(),

      status: 'draft' as TournamentStatus,

      counters: {
        registeredTeams: 0,
        checkedInTeams: 0,

        checkedInPlayers: 0,
        checkedInByRole: { tank: 0, dps: 0, support: 0 },
      },

      createdByUid,
      createdAt: new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (teamMode === 'random') {
      const roleSlotsPerTeam: RoleSlots = (dto.roleSlotsPerTeam as any) ?? this.defaultRoleSlotsPerTeam();
      this.assertRoleSlotsPerTeam(roleSlotsPerTeam);

      const roleSlotsTotal = this.computeRoleSlotsTotal(maxTeams, roleSlotsPerTeam);
      const playerSlotsTotal = maxTeams * ROSTER_MAX_PER_TEAM;

      base.rosterMaxPerTeam = ROSTER_MAX_PER_TEAM;
      base.roleSlotsPerTeam = roleSlotsPerTeam;
      base.roleSlotsTotal = roleSlotsTotal;
      base.playerSlotsTotal = playerSlotsTotal;
    }

    const docRef = await this.torneiosCollection.add(base);
    const snapshot = await docRef.get();
    return { id: snapshot.id, ...snapshot.data() };
  }

  async findAll() {
    const snapshot = await this.torneiosCollection.orderBy('startAt', 'asc').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string) {
    const doc = await this.torneiosCollection.doc(id).get();
    if (!doc.exists) throw new Error(`Torneio com id ${id} não encontrado.`);
    return { id: doc.id, ...doc.data() };
  }

  async update(id: string, dto: UpdateTorneioDto) {
    const ref = this.torneiosCollection.doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error(`Torneio com id ${id} não encontrado.`);

    const t: any = snap.data();
    if (t.status === 'finished') {
      throw new Error('Torneio finalizado nao pode receber edicoes.');
    }
    const canEditCore = t.status === 'draft';

    const updateData: any = { updatedAt: FieldValue.serverTimestamp() };

    if (dto.name != null) {
      const name = String(dto.name).trim();
      if (!name) throw new Error('name inválido');
      updateData.name = name;
    }

    if (dto.description === null || typeof dto.description === 'string') {
      const desc = dto.description == null ? null : String(dto.description).trim();
      if (desc && desc.length > 240) throw new Error('description no máximo 240 caracteres');
      updateData.description = desc;
    }

    if (canEditCore) {
      if (dto.startAt != null) updateData.startAt = this.parseIsoDate(dto.startAt, 'startAt').toISOString();
      if (dto.checkinDeadlineAt != null) {
        updateData.checkinDeadlineAt = this.parseIsoDate(dto.checkinDeadlineAt, 'checkinDeadlineAt').toISOString();
      }

      // Se random e quiser ajustar slots
      if (t.teamMode === 'random' && dto.roleSlotsPerTeam) {
        const roleSlotsPerTeam: RoleSlots = dto.roleSlotsPerTeam as any;
        this.assertRoleSlotsPerTeam(roleSlotsPerTeam);

        updateData.roleSlotsPerTeam = roleSlotsPerTeam;
        updateData.roleSlotsTotal = this.computeRoleSlotsTotal(t.maxTeams, roleSlotsPerTeam);
        updateData.playerSlotsTotal = t.maxTeams * ROSTER_MAX_PER_TEAM;
      }
    }

    // validação de datas pós update (se mexeu em alguma)
    const newStartAt = updateData.startAt ?? t.startAt;
    const newDeadline = updateData.checkinDeadlineAt ?? t.checkinDeadlineAt;
    if (new Date(newDeadline).getTime() >= new Date(newStartAt).getTime()) {
      throw new Error('checkinDeadlineAt deve ser antes de startAt');
    }

    await ref.update(updateData);
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() };
  }

  async remove(id: string): Promise<void> {
    const ref = this.torneiosCollection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new Error(`Torneio com id ${id} não encontrado.`);
    await ref.delete();
  }

  async setStatus(id: string, status: TournamentStatus) {
    const ref = this.torneiosCollection.doc(id);

    await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error(`Torneio com id ${id} não encontrado.`);

      const t = snap.data() as any;
      this.assertStatusTransition(t.status, status);

      tx.update(ref, {
        status,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const updated = await ref.get();
    return { id: updated.id, ...updated.data() };
  }

  // ---------- RANDOM: check-in por role ----------
  async checkinRandom(tournamentId: string, uid: string, dto: CheckinDto) {
    const role = this.normalizeRole(dto?.role);

    const tRef = this.torneiosCollection.doc(tournamentId);
    const pRef = this.participantsCol(tournamentId).doc(uid);

    await firestore.runTransaction(async (tx) => {
      const tSnap = await tx.get(tRef);
      if (!tSnap.exists) throw new Error('Torneio não encontrado');

      const t: any = tSnap.data();

      if (t.teamMode !== 'random') throw new Error('Este torneio não é de times sorteados');
      if (!(t.status === 'published' || t.status === 'checkin')) throw new Error('Check-in fechado');

      const now = Date.now();
      if (new Date(t.checkinDeadlineAt).getTime() < now) throw new Error('Prazo de check-in encerrado');

      const capTotal = Number(t.playerSlotsTotal ?? (t.maxTeams * ROSTER_MAX_PER_TEAM));
      const usedTotal = Number(t.counters?.checkedInPlayers ?? 0);

      const roleCap = Number(t.roleSlotsTotal?.[role] ?? 0);
      const usedRole = Number(t.counters?.checkedInByRole?.[role] ?? 0);

      const pSnap = await tx.get(pRef);
      const existing = pSnap.exists ? (pSnap.data() as any) : null;

      if (existing?.checkedIn) {
        throw new Error('Voce ja realizou check-in neste torneio.');
      }

      // novo check-in
      if (usedTotal >= capTotal) throw new Error('Torneio lotado');
      if (usedRole >= roleCap) throw new Error(`Limite de ${role} atingido`);

      const profile = await this.getUserProfile(uid);
      const displayName = String(profile?.displayName || '').trim();
      const battletag = String(profile?.battletag || '').trim();
      if (!displayName || !battletag) {
        throw new Error('Perfil do usuário incompleto (displayName/battletag).');
      }

      tx.set(
        pRef,
        {
          uid,
          displayName,
          battletag,
          role,
          checkedIn: true,
          checkedInAt: new Date().toISOString(),
          teamId: null,
        },
        { merge: true },
      );

      tx.update(tRef, {
        'counters.checkedInPlayers': FieldValue.increment(1),
        [`counters.checkedInByRole.${role}`]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    try {
      await grantAutomaticTrophiesForEvent('tournament_random_checkin', {
        userUid: uid,
        reason: 'Check-in no torneio random.',
        metadata: {
          tournamentId,
          role,
        },
      });
    } catch (error) {
      console.error('[trofeus] Falha ao conceder trofeu automatico (random checkin):', error);
    }

    const participant = await pRef.get();
    return { id: participant.id, ...participant.data() };
  }

  async listRandomCheckins(tournamentId: string, roleFilter: CheckinRoleFilter = 'all') {
    const tournamentRef = this.torneiosCollection.doc(tournamentId);
    const tournamentSnapshot = await tournamentRef.get();

    if (!tournamentSnapshot.exists) {
      throw new Error('Torneio nao encontrado.');
    }

    const tournament = tournamentSnapshot.data() as { teamMode?: string } | undefined;
    if (tournament?.teamMode !== 'random') {
      throw new Error('Listagem por role disponivel apenas para torneios random.');
    }

    const participantsSnapshot = await this
      .participantsCol(tournamentId)
      .where('checkedIn', '==', true)
      .get();

    const participants = participantsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...(doc.data() as Record<string, unknown>),
        }) as { id: string } & Record<string, unknown>,
    );

    const result = participants
      .filter((participant) => {
        if (roleFilter === 'all') return true;
        return String(participant['role'] ?? '').toLowerCase() === roleFilter;
      })
      .sort((a, b) => {
        const aTime = new Date(String(a['checkedInAt'] ?? '')).getTime();
        const bTime = new Date(String(b['checkedInAt'] ?? '')).getTime();
        return Number.isFinite(bTime) && Number.isFinite(aTime) ? bTime - aTime : 0;
      });

    return result;
  }

  async getRandomCheckinAvailabilityByRole(tournamentId: string): Promise<RandomCheckinAvailabilityByRole> {
    const tournamentRef = this.torneiosCollection.doc(tournamentId);
    const tournamentSnapshot = await tournamentRef.get();

    if (!tournamentSnapshot.exists) {
      throw new Error('Torneio nao encontrado.');
    }

    const tournament = (tournamentSnapshot.data() ?? {}) as Record<string, unknown>;
    if (tournament['teamMode'] !== 'random') {
      throw new Error('Disponivel apenas para torneios random.');
    }

    const maxTeams = this.toNonNegativeInt(tournament['maxTeams']);
    const fallbackRoleCaps = this.computeRoleSlotsTotal(maxTeams, this.defaultRoleSlotsPerTeam());
    const roleSlotsTotal = (tournament['roleSlotsTotal'] as Record<string, unknown>) ?? {};
    const counters = (tournament['counters'] as Record<string, unknown>) ?? {};
    const checkedInByRoleRaw = (counters['checkedInByRole'] as Record<string, unknown>) ?? {};

    const roleCaps: RoleSlots = {
      tank: this.toNonNegativeInt(roleSlotsTotal['tank'] ?? fallbackRoleCaps.tank),
      dps: this.toNonNegativeInt(roleSlotsTotal['dps'] ?? fallbackRoleCaps.dps),
      support: this.toNonNegativeInt(roleSlotsTotal['support'] ?? fallbackRoleCaps.support),
    };

    const checkedInByRole: RoleSlots = {
      tank: this.toNonNegativeInt(checkedInByRoleRaw['tank']),
      dps: this.toNonNegativeInt(checkedInByRoleRaw['dps']),
      support: this.toNonNegativeInt(checkedInByRoleRaw['support']),
    };

    const roleTotals = roleCaps.tank + roleCaps.dps + roleCaps.support;
    const playerSlotsTotal = this.toNonNegativeInt(tournament['playerSlotsTotal']);
    const normalizedTotal = playerSlotsTotal > 0 ? playerSlotsTotal : roleTotals;

    const totalCheckedInCounter = this.toNonNegativeInt(counters['checkedInPlayers']);
    const checkedInByRoleSum = checkedInByRole.tank + checkedInByRole.dps + checkedInByRole.support;
    const normalizedCheckedIn = Math.max(totalCheckedInCounter, checkedInByRoleSum);

    return {
      tournamentId,
      totals: {
        total: normalizedTotal,
        checkedIn: normalizedCheckedIn,
        available: Math.max(normalizedTotal - normalizedCheckedIn, 0),
      },
      roles: {
        tank: {
          total: roleCaps.tank,
          checkedIn: checkedInByRole.tank,
          available: Math.max(roleCaps.tank - checkedInByRole.tank, 0),
        },
        dps: {
          total: roleCaps.dps,
          checkedIn: checkedInByRole.dps,
          available: Math.max(roleCaps.dps - checkedInByRole.dps, 0),
        },
        support: {
          total: roleCaps.support,
          checkedIn: checkedInByRole.support,
          available: Math.max(roleCaps.support - checkedInByRole.support, 0),
        },
      },
    };
  }

  // ---------- CLOSED: criar time + check-in do time ----------
  async createClosedTeam(tournamentId: string, captainUid: string, dto: CreateTeamDto) {
    const name = String(dto?.name || '').trim();
    if (!name) throw new Error('Nome do time é obrigatório');

    const tag = dto.tag == null ? null : String(dto.tag).trim();

    const tRef = this.torneiosCollection.doc(tournamentId);
    const teamRef = this.teamsCol(tournamentId).doc();

    await firestore.runTransaction(async (tx) => {
      const tSnap = await tx.get(tRef);
      if (!tSnap.exists) throw new Error('Torneio não encontrado');
      const t: any = tSnap.data();

      if (t.teamMode !== 'closed') throw new Error('Este torneio não é de times fechados');

      const registered = Number(t.counters?.registeredTeams ?? 0);
      if (registered >= Number(t.maxTeams)) throw new Error('Limite de times atingido');

      tx.set(teamRef, {
        name,
        tag,
        mode: 'closed',
        captainUid,
        checkedIn: false,
        checkedInAt: null,
        createdAt: new Date().toISOString(),
      });

      tx.update(tRef, {
        'counters.registeredTeams': FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const team = await teamRef.get();
    return { id: team.id, ...team.data() };
  }

  async checkinClosedTeam(tournamentId: string, teamId: string, uid: string) {
    const tRef = this.torneiosCollection.doc(tournamentId);
    const tournamentTeamRef = this.teamsCol(tournamentId).doc(teamId);
    const globalTeamRef = this.globalTeamsCollection.doc(teamId);
    const globalTeamMemberRef = this.globalTeamMembersCol(teamId).doc(uid);

    await firestore.runTransaction(async (tx) => {
      const tSnap = await tx.get(tRef);
      if (!tSnap.exists) throw new Error('Torneio nao encontrado');
      const t: any = tSnap.data();

      if (t.teamMode === 'random') {
        throw new Error('Times so podem fazer check-in em torneios nao random');
      }

      if (!(t.status === 'published' || t.status === 'checkin')) {
        throw new Error('Check-in fechado');
      }

      const now = Date.now();
      if (new Date(t.checkinDeadlineAt).getTime() < now) throw new Error('Prazo de check-in encerrado');

      const [tournamentTeamSnap, globalTeamSnap, globalTeamMemberSnap] = await Promise.all([
        tx.get(tournamentTeamRef),
        tx.get(globalTeamRef),
        tx.get(globalTeamMemberRef),
      ]);

      const checkedInTeams = Number(t.counters?.checkedInTeams ?? 0);
      const maxTeams = Number(t.maxTeams);

      if (globalTeamSnap.exists) {
        const globalTeam = (globalTeamSnap.data() ?? {}) as Record<string, unknown>;
        const captainUid = String(globalTeam['captainUid'] ?? '').trim();

        if (!captainUid) {
          throw new Error('Este time nao possui capitao no momento');
        }

        if (!globalTeamMemberSnap.exists) {
          throw new Error('Voce nao faz parte do time informado');
        }

        if (captainUid !== uid) {
          throw new Error('Apenas o capitao pode fazer check-in do time');
        }

        if (tournamentTeamSnap.exists) {
          const currentCheckin = (tournamentTeamSnap.data() ?? {}) as Record<string, unknown>;
          if (currentCheckin['checkedIn']) return;
        }

        if (checkedInTeams >= maxTeams) {
          throw new Error('Limite de check-in de times atingido');
        }

        tx.set(
          tournamentTeamRef,
          {
            teamId,
            name: globalTeam['name'] ?? null,
            tag: globalTeam['tag'] ?? null,
            category: globalTeam['category'] ?? null,
            captainUid,
            membersCount: Number(globalTeam['membersCount'] ?? 0),
            source: 'global_team',
            checkedIn: true,
            checkedInAt: new Date().toISOString(),
            checkedInByUid: uid,
          },
          { merge: true },
        );
      } else {
        if (!tournamentTeamSnap.exists) throw new Error('Time nao encontrado');
        const tournamentTeam = (tournamentTeamSnap.data() ?? {}) as Record<string, unknown>;

        if (tournamentTeam['captainUid'] !== uid) {
          throw new Error('Apenas o capitao pode fazer check-in do time');
        }

        if (tournamentTeam['checkedIn']) return;

        if (checkedInTeams >= maxTeams) {
          throw new Error('Limite de check-in de times atingido');
        }

        tx.update(tournamentTeamRef, {
          checkedIn: true,
          checkedInAt: new Date().toISOString(),
          checkedInByUid: uid,
        });
      }

      tx.update(tRef, {
        'counters.checkedInTeams': FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    try {
      await grantAutomaticTrophiesForEvent('tournament_closed_team_checkin', {
        userUid: uid,
        teamId,
        reason: 'Check-in de time em torneio fechado.',
        metadata: {
          tournamentId,
          teamId,
        },
      });
    } catch (error) {
      console.error('[trofeus] Falha ao conceder trofeu automatico (closed team checkin):', error);
    }

    const updated = await tournamentTeamRef.get();
    return { id: updated.id, ...updated.data() };
  }

  // ---------- RANDOM: lock + draw ----------
  async lockAndDrawRandomTeams(tournamentId: string, adminUid: string) {
    const tRef = this.torneiosCollection.doc(tournamentId);

    // 1) trava e garante idempotência
    await firestore.runTransaction(async (tx) => {
      const tSnap = await tx.get(tRef);
      if (!tSnap.exists) throw new Error('Torneio não encontrado');
      const t: any = tSnap.data();

      if (t.teamMode !== 'random') throw new Error('Somente torneio random pode sortear times');
      if (t.draw?.drawnAt) throw new Error('Times já foram sorteados');

      // trava
      tx.update(tRef, {
        status: 'locked',
        updatedAt: FieldValue.serverTimestamp(),
        'draw.drawnAt': new Date().toISOString(),
        'draw.drawnByUid': adminUid,
      });
    });

    // 2) carrega participantes por role (pode pedir índice composto no Firestore)
    const pCol = this.participantsCol(tournamentId);
    const [tankSnap, dpsSnap, supSnap] = await Promise.all([
      pCol.where('checkedIn', '==', true).where('role', '==', 'tank').get(),
      pCol.where('checkedIn', '==', true).where('role', '==', 'dps').get(),
      pCol.where('checkedIn', '==', true).where('role', '==', 'support').get(),
    ]);

    const tanks = tankSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const dps = dpsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const sups = supSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    const tSnap = await tRef.get();
    if (!tSnap.exists) throw new Error('Torneio não encontrado');
    const t: any = tSnap.data();

    const perTeam: RoleSlots = t.roleSlotsPerTeam ?? this.defaultRoleSlotsPerTeam();
    const maxTeams = Number(t.maxTeams);

    const possibleTeams = Math.min(
      maxTeams,
      Math.floor(tanks.length / perTeam.tank),
      Math.floor(dps.length / perTeam.dps),
      Math.floor(sups.length / perTeam.support),
    );

    if (possibleTeams <= 0) {
      throw new Error('Não há jogadores suficientes por role para formar times completos');
    }

    const shuffle = <T,>(arr: T[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    shuffle(tanks);
    shuffle(dps);
    shuffle(sups);

    const take = <T,>(arr: T[], n: number) => arr.splice(0, n);

    // batch <= 500 ops, use 450 pra margem
    const commitOps = async (ops: Array<(b: FirebaseFirestore.WriteBatch) => void>) => {
      for (let i = 0; i < ops.length; i += 450) {
        const batch = firestore.batch();
        ops.slice(i, i + 450).forEach((op) => op(batch));
        await batch.commit();
      }
    };

    const ops: Array<(b: FirebaseFirestore.WriteBatch) => void> = [];
    const teamsCol = this.teamsCol(tournamentId);

    for (let i = 1; i <= possibleTeams; i++) {
      const teamRef = teamsCol.doc();
      const teamId = teamRef.id;

      ops.push((b) =>
        b.set(teamRef, {
          name: `Team ${i}`,
          mode: 'random',
          createdAt: new Date().toISOString(),
        }),
      );

      const membersCol = teamsCol.doc(teamId).collection('members');

      const pickedTanks = take(tanks, perTeam.tank);
      const pickedDps = take(dps, perTeam.dps);
      const pickedSups = take(sups, perTeam.support);

      const members = [
        ...pickedTanks.map((p) => ({ p, role: 'tank' as Role })),
        ...pickedDps.map((p) => ({ p, role: 'dps' as Role })),
        ...pickedSups.map((p) => ({ p, role: 'support' as Role })),
      ];

      for (const m of members) {
        const memberRef = membersCol.doc(m.p.uid);

        ops.push((b) =>
          b.set(memberRef, {
            uid: m.p.uid,
            role: m.role,
            displayName: m.p.displayName,
            battletag: m.p.battletag,
            joinedAt: new Date().toISOString(),
          }),
        );

        const participantRef = pCol.doc(m.p.uid);
        ops.push((b) => b.update(participantRef, { teamId }));
      }
    }

    await commitOps(ops);

    const unassigned = {
      tank: tanks.length,
      dps: dps.length,
      support: sups.length,
      total: tanks.length + dps.length + sups.length,
    };

    await tRef.update({
      'draw.teamsGenerated': possibleTeams,
      'draw.unassigned': unassigned,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { tournamentId, teamsGenerated: possibleTeams, unassigned };
  }
}

export const torneiosSvc = new TorneiosService();

