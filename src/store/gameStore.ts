/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { GameState, Skin, LeaderboardEntry } from '../shared/types';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  collection,
  serverTimestamp,
  addDoc,
  deleteDoc,
  writeBatch,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';

export const SKINS: Skin[] = [
  { id: 'neon-pink', name: 'Neon Pink', type: 'color', value: '#ff7eb3', price: 0 },
  { id: 'neon-orange', name: 'Neon Orange', type: 'color', value: '#ffb86c', price: 100 },
  { id: 'neon-yellow', name: 'Neon Yellow', type: 'color', value: '#f1fa8c', price: 100 },
  { id: 'neon-green', name: 'Neon Green', type: 'color', value: '#50fa7b', price: 100 },
  { id: 'neon-blue', name: 'Neon Blue', type: 'color', value: '#8be9fd', price: 100 },
  { id: 'neon-purple', name: 'Neon Purple', type: 'color', value: '#bd93f9', price: 100 },
  { id: 'neon-red', name: 'Neon Red', type: 'color', value: '#ff5555', price: 150 },
  { id: 'neon-gold', name: 'Neon Gold', type: 'color', value: '#ffd700', price: 500 },
  { id: 'crown', name: 'Golden Crown', type: 'pattern', value: 'crown', price: 500 },
  { id: 'kurdistan', name: 'Kurdistan Flag', type: 'pattern', value: 'kurdistan', price: 550 },
  { id: 'realmadrid', name: 'Real Madrid', type: 'pattern', value: 'realmadrid', price: 670 },
  { id: 'usa', name: 'USA Flag', type: 'pattern', value: 'usa', price: 1000 },
  { id: 'skull', name: 'Skull Head', type: 'pattern', value: 'skull', price: 1500 },
  { id: 'viking', name: 'Viking Head', type: 'pattern', value: 'viking', price: 1200 },
  { id: 'redcap', name: 'Red Cap', type: 'pattern', value: 'redcap', price: 400 },
  { id: 'admin-neon', name: 'Admin Neon', type: 'pattern', value: 'admin', price: 0 },
];

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  money: number;
  ownedSkins: string[];
  currentSkin: string;
  highScore?: number;
}

interface GameStore {
  socket: Socket | null;
  gameState: GameState | null;
  playerId: string | null;
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isAuthLoading: boolean;
  notifications: { id: string, message: string }[];
  isDead: boolean;
  lastDeathStats: { score: number, kills: number, killerName: string } | null;
  mobileInputs: { left: boolean, right: boolean, boost: boolean };
  joystickAngle: number | null;
  leaderboardRange: 'live' | 'daily' | 'weekly' | 'all-time';
  globalLeaderboard: LeaderboardEntry[];
  isAdmin: boolean;
  customSkins: Skin[];
  setLeaderboardRange: (range: 'live' | 'daily' | 'weekly' | 'all-time') => void;
  connect: () => void;
  setMobileInput: (input: 'left' | 'right' | 'boost', active: boolean) => void;
  setJoystickAngle: (angle: number | null) => void;
  joinGame: () => void;
  addNotification: (message: string) => void;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  sendPlayerState: (data: any) => void;
  sendCollectOrb: (orbId: string) => void;
  login: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string, avatarUrl?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  buySkin: (skinId: string) => Promise<void>;
  setSkin: (skinId: string) => Promise<void>;
  verifyAdmin: (password: string) => boolean;
  addCustomSkin: (skin: Omit<Skin, 'id'>) => Promise<void>;
  deleteCustomSkin: (skinId: string) => Promise<void>;
  setMoney: (amount: number) => Promise<void>;
  resetAllUsersMoney: () => Promise<void>;
  _profileUnsubscribe?: (() => void) | null;
  _skinsUnsubscribe?: (() => void) | null;
}

export const globalGameState: { current: GameState | null } = { current: null };
let lastUiUpdate = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  playerId: null,
  user: null,
  profile: null,
  isAuthLoading: true,
  notifications: [],
  isDead: false,
  lastDeathStats: null,
  mobileInputs: { left: false, right: false, boost: false },
  joystickAngle: null as number | null,
  leaderboardRange: 'live',
  globalLeaderboard: [],
  isAdmin: false,
  customSkins: [],
  _profileUnsubscribe: null,
  _skinsUnsubscribe: null,

  setLeaderboardRange: async (range) => {
    set({ leaderboardRange: range });
    if (range === 'live') return;

    const scoresRef = collection(db, 'scores');
    let q;
    const now = new Date();

    if (range === 'daily') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      q = query(scoresRef, where('timestamp', '>', yesterday), limit(100));
    } else if (range === 'weekly') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      q = query(scoresRef, where('timestamp', '>', lastWeek), limit(100));
    } else {
      q = query(scoresRef, orderBy('score', 'desc'), limit(10));
    }

    try {
      const snapshot = await getDocs(q);
      let entries = snapshot.docs.map(doc => {
        const data = doc.data() as { name?: string, score?: number, userId?: string };
        return {
          id: doc.id,
          uid: data.userId,
          name: data.name || 'Anonymous',
          score: data.score || 0,
          color: '#fff'
        };
      });
      
      if (range === 'daily' || range === 'weekly') {
        entries.sort((a, b) => b.score - a.score);
        entries = entries.slice(0, 10);
      }
      
      set({ globalLeaderboard: entries });
    } catch (err) {
      console.error('Failed to fetch global leaderboard', err);
      // Fallback for missing index or other error: just show empty or all-time if possible
      if (range !== 'all-time') {
        try {
          const allTimeQ = query(scoresRef, orderBy('score', 'desc'), limit(10));
          const allTimeSnap = await getDocs(allTimeQ);
          const entries = allTimeSnap.docs.map(doc => {
            const data = doc.data() as { name?: string, score?: number, userId?: string };
            return {
              id: doc.id,
              uid: data.userId,
              name: data.name || 'Anonymous',
              score: data.score || 0,
              color: '#fff'
            };
          });
          set({ globalLeaderboard: entries });
        } catch (innerErr) {
          handleFirestoreError(innerErr, OperationType.GET, 'scores');
        }
      } else {
        handleFirestoreError(err, OperationType.GET, 'scores');
      }
    }
  },

  setMobileInput: (input, active) => {
    set(state => ({
      mobileInputs: { ...state.mobileInputs, [input]: active }
    }));
  },

  setJoystickAngle: (angle: number | null) => {
    set({ joystickAngle: angle });
  },

  connect: () => {
    if (get().socket) return;
    
    const socket = io();

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('init', (id: string) => {
      set({ playerId: id });
    });

    socket.on('player_killed', async (data: { killerId: string, killerName: string, victimId: string, victimName: string }) => {
      const { playerId, user, profile, gameState } = get();
      
      const message = data.killerId === playerId 
        ? `You killed ${data.victimName}!` 
        : `${data.killerName} killed ${data.victimName}`;
      
      get().addNotification(message);

      // Reward killer with money
      if (data.killerId === playerId && user && profile) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
          money: profile.money + 50,
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }

      // If we are the victim, save high score and show game over
      if (data.victimId === playerId && user && profile && gameState) {
        const myPlayer = gameState.players[playerId];
        if (myPlayer) {
          const score = Math.floor(myPlayer.score);
          set({ 
            isDead: true, 
            lastDeathStats: { 
              score, 
              kills: 0, // We don't track per-session kills in state yet, but we could
              killerName: data.killerName 
            } 
          });

          try {
            // Save to global scores if significant
            if (score > 10) {
              await addDoc(collection(db, 'scores'), {
                userId: user.uid,
                name: myPlayer.name,
                score: score,
                timestamp: serverTimestamp()
              });
            }

            // Update user high score
            if (score > (profile.highScore || 0)) {
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                highScore: score
              });
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'scores/users');
          }
        }
      }
    });

    socket.on('state', (state: GameState) => {
      globalGameState.current = state;
      const now = Date.now();
      if (now - lastUiUpdate > 100) {
        set({ gameState: state });
        lastUiUpdate = now;
      }
    });

    set({ socket });
    
    // Listen for custom skins
    if (!get()._skinsUnsubscribe) {
      const skinsRef = collection(db, 'skins');
      const unsub = onSnapshot(skinsRef, (snapshot) => {
        const skins = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Skin));
        set({ customSkins: skins });
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'skins');
      });
      set({ _skinsUnsubscribe: unsub });
    }

    // Firebase Auth Listener
    onAuthStateChanged(auth, async (user) => {
      set({ user, isAuthLoading: false });
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            const initialProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'Anonymous',
              photoURL: user.photoURL || null,
              money: 0,
              ownedSkins: ['neon-pink'],
              currentSkin: 'neon-pink',
              highScore: 0,
            };
            await setDoc(userRef, initialProfile);
            set({ profile: initialProfile });
          } else {
            set({ profile: userDoc.data() as UserProfile });
          }

          // Live profile updates - only if not already listening
          if (!get()._profileUnsubscribe) {
            const unsub = onSnapshot(userRef, (doc) => {
              if (doc.exists()) {
                set({ profile: doc.data() as UserProfile });
              }
            }, (err) => {
              handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
            });
            set({ _profileUnsubscribe: unsub });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'users/profile');
        }
      } else {
        const unsub = get()._profileUnsubscribe;
        if (unsub) {
          unsub();
          set({ _profileUnsubscribe: null });
        }
        set({ profile: null });
      }
    });
  },

  login: async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  },

  signUpWithEmail: async (email, password, username, avatarUrl) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Firebase Auth photoURL has a strict length limit (~2000 chars). 
      // Base64 avatars should only be stored in Firestore.
      const authPhotoURL = avatarUrl && avatarUrl.length < 2048 ? avatarUrl : null;
      
      await updateProfile(userCredential.user, { 
        displayName: username,
        photoURL: authPhotoURL
      });
      
      const userRef = doc(db, 'users', userCredential.user.uid);
      const initialProfile: UserProfile = {
        uid: userCredential.user.uid,
        displayName: username,
        photoURL: avatarUrl || null,
        money: 0,
        ownedSkins: ['neon-pink'],
        currentSkin: 'neon-pink',
        highScore: 0,
      };
      await setDoc(userRef, initialProfile);
      set({ profile: initialProfile, user: userCredential.user });
    } catch (error) {
      if (error instanceof Error && error.message.includes('{')) {
        throw error;
      }
      handleFirestoreError(error, OperationType.WRITE, 'users/new');
    }
  },

  signInWithEmail: async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in failed', error);
      throw error;
    }
  },

  logout: async () => {
    await auth.signOut();
  },

  buySkin: async (skinId) => {
    const { profile, user, customSkins } = get();
    if (!profile || !user) return;
    
    const allSkins = [...SKINS, ...customSkins];
    const skin = allSkins.find(s => s.id === skinId);
    if (!skin || profile.money < skin.price || profile.ownedSkins.includes(skinId)) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        money: profile.money - skin.price,
        ownedSkins: [...profile.ownedSkins, skinId],
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  },

  setSkin: async (skinId) => {
    const { profile, user, customSkins } = get();
    if (!profile || !user || !profile.ownedSkins.includes(skinId)) return;

    const allSkins = [...SKINS, ...customSkins];
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        currentSkin: skinId,
      });
      
      const skin = allSkins.find(s => s.id === skinId);
      get().addNotification(`Equipped ${skin?.name || 'skin'}!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  },

  joinGame: () => {
    const { socket, profile, user } = get();
    if (socket && user) {
      set({ isDead: false, lastDeathStats: null });
      const skin = profile?.currentSkin || 'neon-pink';
      const name = profile?.displayName || user.displayName || 'Anonymous';
      socket.emit('join', { skin, name, uid: user.uid });
    }
  },
  
  addNotification: (message: string) => {
    const { notifications } = get();
    // More robust duplicate guard: check both store and a very recent window
    if (notifications.some(n => n.message === message)) return;

    // Additional guard for messages added in the same execution burst
    const now = Date.now();
    const lastNotifKey = `last_notif_${message}`;
    if ((globalThis as any)[lastNotifKey] && now - (globalThis as any)[lastNotifKey] < 2000) return;
    (globalThis as any)[lastNotifKey] = now;

    const id = `${Date.now()}-${Math.random()}`;
    const newNotif = { id, message };
    set(state => ({ notifications: [...state.notifications, newNotif] }));
    setTimeout(() => {
      set(state => ({ notifications: get().notifications.filter(n => n.id !== id) }));
      delete (globalThis as any)[lastNotifKey];
    }, 3000);
  },

  updateAvatar: async (avatarUrl: string) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    try {
      // Only update Firebase Auth profile if the URL is short enough (not a long data URI)
      if (avatarUrl.length < 2048) {
        await updateProfile(user, { photoURL: avatarUrl });
      }
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoURL: avatarUrl });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  },

  verifyAdmin: (password: string) => {
    if (password === 'EMAD8912') {
      const { profile, user } = get();
      set({ isAdmin: true });
      if (user && profile) {
        // Automatically give admin all skins
        const allSkinIds = [...SKINS.map(s => s.id), ...get().customSkins.map(s => s.id)];
        updateDoc(doc(db, 'users', user.uid), {
          ownedSkins: Array.from(new Set([...profile.ownedSkins, ...allSkinIds])),
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
      }
      return true;
    }
    return false;
  },

  setMoney: async (amount: number) => {
    const { isAdmin, user } = get();
    if (!isAdmin || !user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        money: amount
      });
      get().addNotification(`Balance set to $${amount}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  },

  resetAllUsersMoney: async () => {
    const { isAdmin } = get();
    if (!isAdmin) return;

    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      
      usersSnap.docs.forEach(u => {
        batch.update(u.ref, { money: 0 });
      });

      await batch.commit();
      get().addNotification(`NUKED ALL BALANCES TO $0`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/all');
    }
  },

  addCustomSkin: async (skinData) => {
    const { isAdmin } = get();
    if (!isAdmin) throw new Error('Unauthorized');
    
    try {
      await addDoc(collection(db, 'skins'), {
        ...skinData,
        id: skinData.name.toLowerCase().replace(/\s+/g, '-'), // Temporary ID generation
      });
      get().addNotification(`Successfully added skin: ${skinData.name}!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'skins');
    }
  },

  deleteCustomSkin: async (skinId: string) => {
    const { isAdmin } = get();
    if (!isAdmin) throw new Error('Unauthorized');

    try {
      await deleteDoc(doc(db, 'skins', skinId));
      get().addNotification(`Successfully deleted skin!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `skins/${skinId}`);
    }
  },

  sendPlayerState: (data) => {
    const { socket } = get();
    if (socket) {
      socket.emit('update_state', data);
    }
  },

  sendCollectOrb: (orbId) => {
    const { socket, profile, user } = get();
    if (socket) {
      socket.emit('collect_orb', orbId);
      
      // Throttled money update using a simple local buffer
      if (user && profile) {
        // We update the local profile state immediately for the UI to feel responsive,
        // but we only write to Firestore after a small delay.
        const currentMoney = profile.money;
        const newMoney = currentMoney + 1;
        
        // Optimistic local update
        set(state => ({
          profile: state.profile ? { ...state.profile, money: newMoney } : null
        }));

        // Debounced firestore update
        const moneyUpdateKey = `money_update_${user.uid}`;
        if ((globalThis as any)[moneyUpdateKey]) clearTimeout((globalThis as any)[moneyUpdateKey]);
        
        (globalThis as any)[moneyUpdateKey] = setTimeout(async () => {
          try {
            const userRef = doc(db, 'users', user.uid);
            // Get the latest money from the store to ensure we persist the accumulated value
            const latestProfile = get().profile;
            if (latestProfile) {
              await updateDoc(userRef, {
                money: latestProfile.money,
              });
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
          } finally {
            delete (globalThis as any)[moneyUpdateKey];
          }
        }, 1000);
      }
    }
  },
}));
