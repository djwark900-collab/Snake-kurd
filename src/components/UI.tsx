/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useGameStore, SKINS } from '../store/gameStore';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ShoppingBag, LogIn, LogOut, User, DollarSign, ChevronLeft, Check, Mail, Lock, UserPlus, Trash2, Settings, Share2 } from 'lucide-react';
import { useState } from 'react';
import { GameState, WORLD_SIZE } from '../shared/types';

function Minimap({ gameState, currentPlayerId }: { gameState: GameState | null, currentPlayerId: string | null }) {
  if (!gameState) return null;
  const size = 120;
  const scale = size / WORLD_SIZE;

  return (
    <div 
      className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl relative overflow-hidden pointer-events-none shadow-2xl"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
      {Object.values(gameState.players).map((p, i) => {
        if (p.state !== 'alive' || !p.segments[0]) return null;
        const x = (p.segments[0].x + WORLD_SIZE / 2) * scale;
        const y = (p.segments[0].y + WORLD_SIZE / 2) * scale;
        const isCurrent = p.id === currentPlayerId;
        
        return (
          <div 
            key={`minimap-player-${p.id || p.uid || i}-${i}`}
            className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${isCurrent ? 'bg-white z-10 scale-125' : ''}`}
            style={{ 
              left: x, 
              bottom: y,
              backgroundColor: isCurrent ? '#fff' : p.color,
              boxShadow: isCurrent ? '0 0 10px #fff' : `0 0 4px ${p.color}`
            }}
          />
        );
      })}
    </div>
  );
}

export function UI() {
  const gameState = useGameStore(state => state.gameState);
  const playerId = useGameStore(state => state.playerId);
  const joinGame = useGameStore(state => state.joinGame);
  const user = useGameStore(state => state.user);
  const profile = useGameStore(state => state.profile);
  const login = useGameStore(state => state.login);
  const logout = useGameStore(state => state.logout);
  const isAuthLoading = useGameStore(state => state.isAuthLoading);
  const isDead = useGameStore(state => state.isDead);
  const lastDeathStats = useGameStore(state => state.lastDeathStats);
  const buySkin = useGameStore(state => state.buySkin);
  const setSkin = useGameStore(state => state.setSkin);
  const isAdmin = useGameStore(state => state.isAdmin);
  const verifyAdmin = useGameStore(state => state.verifyAdmin);
  const addCustomSkin = useGameStore(state => state.addCustomSkin);
  const deleteCustomSkin = useGameStore(state => state.deleteCustomSkin);
  const customSkins = useGameStore(state => state.customSkins);
  const notifications = useGameStore(state => state.notifications);
  const mobileInputs = useGameStore(state => state.mobileInputs);
  const setMobileInput = useGameStore(state => state.setMobileInput);
  const setJoystickAngle = useGameStore(state => state.setJoystickAngle);
  const leaderboardRange = useGameStore(state => state.leaderboardRange);
  const globalLeaderboard = useGameStore(state => state.globalLeaderboard);
  const setLeaderboardRange = useGameStore(state => state.setLeaderboardRange);
  const [view, setView] = useState<'lobby' | 'shop' | 'leaderboard'>('lobby');
  const [showHUDLeaderboard, setShowHUDLeaderboard] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [joystickStart, setJoystickStart] = useState<{ x: number, y: number } | null>(null);
  const [joystickPos, setJoystickPos] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  const [showSettings, setShowSettings] = useState(false);

  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setJoystickStart({ x: clientX, y: clientY });
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickStart) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - joystickStart.x;
    const dy = clientY - joystickStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 50;
    
    const limitedX = (dx / dist) * Math.min(dist, maxDist);
    const limitedY = (dy / dist) * Math.min(dist, maxDist);
    
    setJoystickPos({ x: limitedX, y: limitedY });
    
    // Calculate angle (inverted y because screen space is top-down)
    const angle = Math.atan2(-limitedY, limitedX);
    setJoystickAngle(angle);
  };

  const handleJoystickEnd = () => {
    setJoystickStart(null);
    setJoystickPos({ x: 0, y: 0 });
    setJoystickAngle(null);
  };

  const player = playerId && gameState ? gameState.players[playerId] : null;
  const isAlive = player?.state === 'alive';

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminSkinForm, setAdminSkinForm] = useState({ name: '', price: '100', value: '', type: 'color' as 'color' | 'pattern' });
  const [adminError, setAdminError] = useState('');
  const [adminMoneyInput, setAdminMoneyInput] = useState('0');
  
  const signUpWithEmail = useGameStore(state => state.signUpWithEmail);
  const signInWithEmail = useGameStore(state => state.signInWithEmail);
  const updateAvatar = useGameStore(state => state.updateAvatar);
  const setMoney = useGameStore(state => state.setMoney);
  const resetAllUsersMoney = useGameStore(state => state.resetAllUsersMoney);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 500) { // 500KB limit for base64 storage
        setError('Avatar must be under 500KB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 500) {
        setError('Avatar must be under 500KB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await updateAvatar(reader.result as string);
        } catch (err: any) {
          setError(err.message || 'Failed to update avatar');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsUploading(true);
    try {
      if (authMode === 'signup') {
        if (!username) throw new Error('Username is required');
        await signUpWithEmail(email, password, username, avatarPreview || undefined);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase. Please enable it in the Firebase Console: Authentication > Sign-in method.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">NEON.SNAKE</h1>
            <p className="text-white/40 sm:text-base text-sm">
              {authMode === 'login' ? 'Welcome back, Snake.' : 'Join the neon arena.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!useEmail ? (
              <motion.div
                key="google"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <motion.button
                  onClick={login}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <LogIn size={20} />
                  <span>Continue with Google</span>
                </motion.button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-white/20">Or use email</span></div>
                </div>
                <button 
                  onClick={() => setUseEmail(true)}
                  className="w-full py-3 text-white/60 font-medium text-sm hover:text-white transition-colors"
                >
                  Sign in with Email & Password
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleAuth}
                className="space-y-4"
              >
                {authMode === 'signup' && (
                  <div className="flex flex-col items-center gap-4 mb-4">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 flex items-center justify-center transition-all group-hover:border-white/30">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <User size={40} className="text-white/20" />
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          title="Choose Avatar"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <UserPlus size={20} className="text-white" />
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white text-black p-1.5 rounded-full shadow-lg">
                        <UserPlus size={12} strokeWidth={3} />
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center">
                      {avatarFile ? avatarFile.name : 'Choose Avatar Image'}
                    </span>
                  </div>
                )}
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/40 uppercase ml-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder="SnakeMaster"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/30"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/40 uppercase ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="email" 
                      required
                      placeholder="snake@neon.io"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/30"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/40 uppercase ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/30"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && <div className="text-red-500 text-xs text-center font-medium bg-red-500/10 p-2 rounded-lg">{error}</div>}

                <motion.button
                  type="submit"
                  disabled={isUploading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-center gap-3 py-4 bg-white text-black font-bold rounded-xl shadow-lg mt-4 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {authMode === 'signup' ? <UserPlus size={20} /> : <LogIn size={20} />}
                      <span>{authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                    </>
                  )}
                </motion.button>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-xs text-white/40 hover:text-white transition-colors"
                  >
                    {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setUseEmail(false)}
                    className="text-xs text-white/20 hover:text-white/40 transition-colors"
                  >
                    Back to Google Login
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      {/* Top Bar - High Priority Layer */}
      <div className="absolute inset-x-0 top-0 p-4 pointer-events-none z-[120]">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tighter" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
                NEON.SNAKE
              </h1>
              {profile && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-black/40">
                    {(user.photoURL || profile?.photoURL) ? (
                      <img src={user.photoURL || profile?.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={16} className="text-white/40" />
                      </div>
                    )}
                  </div>
                  <div className="bg-zinc-800/80 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full flex items-center gap-2">
                    <DollarSign size={14} className="text-yellow-400" />
                    <span className="text-sm font-bold text-white font-mono">{profile.money}</span>
                  </div>
                </div>
              )}
            </div>
            {isAlive && (
              <div className="flex flex-col">
                <div className="text-xl font-mono text-white/80 font-bold">
                  Length: {Math.floor(player.score)}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 pointer-events-auto">
            <motion.button
              onClick={() => setView('leaderboard')}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(234, 179, 8, 0.2)', color: 'rgb(253, 224, 71)' }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white transition-colors"
              title="Leaderboard"
            >
              <Trophy size={16} />
            </motion.button>
            <motion.button
              onClick={() => setShowHUDLeaderboard(!showHUDLeaderboard)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 backdrop-blur-md rounded-full transition-colors ${showHUDLeaderboard ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}
              title="Toggle Mini Leaderboard"
            >
              <span className="text-[10px] font-black">HUD</span>
            </motion.button>
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 backdrop-blur-md rounded-full transition-colors ${showSettings ? 'bg-white/20 text-white' : 'bg-white/10 text-white'}`}
              title="Settings"
            >
              <Settings size={16} />
            </motion.button>
            <motion.button
              onClick={logout}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'rgb(248, 113, 113)' }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      {isAlive && (
        <div className="absolute inset-x-0 bottom-8 flex justify-between px-8 pointer-events-none md:hidden items-center">
          {/* Joystick Base */}
          <div 
            className="w-32 h-32 rounded-full bg-white/5 border-2 border-white/10 backdrop-blur-md flex items-center justify-center pointer-events-auto relative mt-auto"
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onMouseDown={handleJoystickStart}
            onMouseMove={handleJoystickMove}
            onMouseUp={handleJoystickEnd}
            onMouseLeave={handleJoystickEnd}
          >
            <motion.div 
              animate={{ x: joystickPos.x, y: joystickPos.y }}
              transition={{ type: 'spring', damping: 20, stiffness: 300, mass: 0.5 }}
              className="w-12 h-12 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-blue-400"
            />
            
            {/* Visual Guide */}
            <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-[1px] bg-white/5" />
          </div>
          
          <div className="flex flex-col gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onMouseDown={() => setMobileInput('boost', true)}
              onMouseUp={() => setMobileInput('boost', false)}
              onMouseLeave={() => setMobileInput('boost', false)}
              onTouchStart={(e) => { e.preventDefault(); setMobileInput('boost', true); }}
              onTouchEnd={(e) => { e.preventDefault(); setMobileInput('boost', false); }}
              className={`w-28 h-28 rounded-full border-2 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center transition-all pointer-events-auto ${
                mobileInputs.boost ? 'border-orange-400 bg-orange-400/20' : 'border-white/20'
              }`}
            >
              <div className={`w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin mb-1 ${mobileInputs.boost ? 'opacity-100' : 'opacity-40'}`} />
              <span className={`text-white font-black italic text-xs tracking-widest text-center ${mobileInputs.boost ? 'text-orange-400' : 'opacity-60'}`}>BOOST<br/>SPEED</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Menus */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            key="settings-menu"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-20 right-4 w-72 bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl z-[150] pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white italic tracking-tighter">SETTINGS</h3>
              <Settings size={20} className="text-blue-500 animate-spin-slow" />
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-xs font-bold text-white/60">Live Minimap</span>
                  <button 
                    onClick={() => setShowMinimap(!showMinimap)}
                    className={`w-10 h-5 rounded-full relative flex items-center px-1 transition-all ${showMinimap ? 'bg-blue-600' : 'bg-zinc-700'}`}
                  >
                    <motion.div 
                      layout
                      className={`w-3 h-3 bg-white rounded-full ${showMinimap ? 'ml-auto' : 'mr-auto'}`} 
                    />
                  </button>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-xs font-bold text-white/60">HUD Rankings</span>
                  <button 
                    onClick={() => setShowHUDLeaderboard(!showHUDLeaderboard)}
                    className={`w-10 h-5 rounded-full relative flex items-center px-1 transition-all ${showHUDLeaderboard ? 'bg-blue-600' : 'bg-zinc-700'}`}
                  >
                    <motion.div 
                      layout
                      className={`w-3 h-3 bg-white rounded-full ${showHUDLeaderboard ? 'ml-auto' : 'mr-auto'}`} 
                    />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                <button 
                   onClick={() => {
                     navigator.clipboard.writeText(window.location.href);
                     useGameStore.getState().addNotification('Invite link copied!');
                   }}
                   className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors"
                >
                  <Share2 size={14} />
                  Invite Friends
                </button>
                <button 
                   onClick={() => setView('shop')}
                   className="w-full py-3 bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
                >
                  <ShoppingBag size={14} />
                  Change Skin
                </button>
                <button 
                   onClick={logout}
                   className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showAdminLogin && !isAdmin && (
          <motion.div
            key="admin-login-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/90 backdrop-blur-xl z-[300] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative"
            >
              <button 
                onClick={() => setShowAdminLogin(false)}
                className="absolute top-4 right-4 text-white/20 hover:text-white"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="text-center mb-6">
                <Lock size={40} className="mx-auto text-blue-500 mb-4" />
                <h2 className="text-2xl font-black text-white italic tracking-tighter">ADMIN PORTAL</h2>
                <p className="text-white/40 text-xs mt-1">Authorized access only</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/40 uppercase ml-1">Admin Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      setAdminError('');
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-white text-center text-xl tracking-[0.5em] focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                {adminError && <div className="text-red-500 text-[10px] font-bold text-center">{adminError}</div>}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const success = verifyAdmin(adminPasswordInput);
                    if (!success) setAdminError('INVALID CREDENTIALS');
                  }}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-600/20"
                >
                  VERIFY IDENTITY
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAdminLogin && isAdmin && (
          <motion.div
            key="admin-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/90 backdrop-blur-xl z-[300] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowAdminLogin(false)}
                className="absolute top-4 right-4 text-white/20 hover:text-white"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-black text-white italic tracking-tighter">ADMIN PANEL</h2>
                <div className="h-1 w-12 bg-blue-500 mt-1" />
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">Add New Skin</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-white/30 uppercase ml-1">Skin Name</label>
                      <input 
                        type="text"
                        placeholder="Golden Snake"
                        value={adminSkinForm.name}
                        onChange={(e) => setAdminSkinForm({...adminSkinForm, name: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-white/30 uppercase ml-1">Price ($)</label>
                      <input 
                        type="number"
                        value={adminSkinForm.price}
                        onChange={(e) => setAdminSkinForm({...adminSkinForm, price: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/30 uppercase ml-1">Skin Type</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setAdminSkinForm({...adminSkinForm, type: 'color'})}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${adminSkinForm.type === 'color' ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}
                      >
                        Color
                      </button>
                      <button 
                        onClick={() => setAdminSkinForm({...adminSkinForm, type: 'pattern'})}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${adminSkinForm.type === 'pattern' ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}
                      >
                        Pattern/Img
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/30 uppercase ml-1">
                      {adminSkinForm.type === 'color' ? 'Hex Color code' : 'Image URL or Pattern ID'}
                    </label>
                    <input 
                      type="text"
                      placeholder={adminSkinForm.type === 'color' ? '#FFD700' : 'https://image.com/skin.png'}
                      value={adminSkinForm.value}
                      onChange={(e) => setAdminSkinForm({...adminSkinForm, value: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      if (!adminSkinForm.name || !adminSkinForm.value) return;
                      await addCustomSkin({
                        name: adminSkinForm.name,
                        price: parseInt(adminSkinForm.price),
                        type: adminSkinForm.type,
                        value: adminSkinForm.value
                      });
                      setAdminSkinForm({ name: '', price: '100', value: '', type: 'color' });
                    }}
                    className="w-full py-4 bg-white text-black font-black rounded-xl text-sm shadow-xl"
                  >
                    DEPLOY SKIN
                  </motion.button>
                </div>

                {/* Money Control */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">Balance Protocol</h3>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      value={adminMoneyInput}
                      onChange={(e) => setAdminMoneyInput(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white"
                      placeholder="Amount"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMoney(parseInt(adminMoneyInput) || 0)}
                      className="px-6 bg-blue-600 text-white font-black rounded-lg text-xs"
                    >
                      SET MONEY
                    </motion.button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setAdminMoneyInput('0'); setMoney(0); }}
                      className="py-2 bg-red-500/20 text-red-500 rounded-lg text-[10px] font-black hover:bg-red-500/40 transition-colors"
                    >
                      RESET TO 0
                    </button>
                    <button 
                      onClick={() => { setAdminMoneyInput('100000'); setMoney(100000); }}
                      className="py-2 bg-green-500/20 text-green-500 rounded-lg text-[10px] font-black hover:bg-green-500/40 transition-colors"
                    >
                      ADD $100K
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      if(confirm("DANGER: This will set EVERY user's balance to $0. Proceed?")) {
                        resetAllUsersMoney();
                      }
                    }}
                    className="w-full py-3 bg-red-600 text-white rounded-lg text-[10px] font-black hover:bg-red-700 transition-colors mt-2 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={12} />
                    NUKE ALL USER BALANCES
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-black text-white/40 uppercase tracking-widest pl-1">Live Custom Skins</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {customSkins.map((s, i) => (
                      <div key={`admin-skin-item-${s.id || i}-${i}`} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-white/20" 
                            style={{ backgroundColor: s.type === 'color' ? s.value : '#fff' }}
                          />
                          <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{s.name}</span>
                          <span className="text-[10px] font-mono text-yellow-400">${s.price}</span>
                        </div>
                        <button 
                          onClick={() => deleteCustomSkin(s.id)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-500 rounded transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {customSkins.length === 0 && <div className="col-span-2 text-center text-[10px] text-white/20 py-4 italic">No custom skins yet</div>}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isDead && lastDeathStats && (
          <motion.div
            key="death-screen-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/80 backdrop-blur-md z-[200]"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/20 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full flex flex-col items-center gap-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
              
              <div className="text-center">
                <h2 className="text-5xl font-black text-white italic tracking-tighter mb-2">GAME OVER</h2>
                <div className="text-red-400 font-bold tracking-widest text-sm uppercase">
                  {lastDeathStats.killerName === 'The Wall' ? 'You hit the wall!' : `Killed by ${lastDeathStats.killerName || 'Unknown'}`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center">
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Final Score</span>
                  <span className="text-3xl font-black text-white font-mono">{lastDeathStats.score}</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center">
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">High Score</span>
                  <span className="text-3xl font-black text-blue-400 font-mono">{profile?.highScore || lastDeathStats.score}</span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-3">
                {lastDeathStats.killerName !== 'The Wall' && (
                  <motion.button
                    onClick={joinGame}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,255,255,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-5 bg-white text-black font-black text-2xl rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3"
                  >
                    RESPAWN
                  </motion.button>
                )}
                <motion.button
                  onClick={() => useGameStore.setState({ isDead: false, lastDeathStats: null })}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-4 font-bold rounded-2xl transition-all ${lastDeathStats.killerName === 'The Wall' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                >
                  RETURN TO LOBBY
                </motion.button>
              </div>

              <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 px-4 py-2 rounded-full">
                <DollarSign size={14} className="text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400">GOT $50 FROM KILLS? CHECK SHOP!</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {(view !== 'lobby' || !player) && !isDead && (
          <motion.div
            key="main-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm z-[100]"
          >
            {view === 'lobby' ? (
              <div className="bg-zinc-900/90 p-8 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full flex flex-col items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                
                <div className="flex flex-col items-center gap-2">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 mb-2 flex items-center justify-center transition-all group-hover:border-white/40 cursor-pointer">
                      {(user.photoURL || profile?.photoURL) ? (
                        <img src={user.photoURL || profile?.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={32} className="text-white/20" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleProfileAvatarChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        title="Change Avatar"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <UserPlus size={16} className="text-white" />
                      </div>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">{user.displayName}</h2>
                  <div className="flex items-center gap-4">
                    <div className="text-white/40 text-xs flex flex-col items-center">
                      <span className="font-bold text-white/60">MONEY</span>
                      <span className="font-mono text-yellow-400 text-lg">${profile?.money || 0}</span>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-white/40 text-xs flex flex-col items-center">
                      <span className="font-bold text-white/60">BEST</span>
                      <span className="font-mono text-blue-400 text-lg">{profile?.highScore || 0}</span>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-white/40 text-xs flex flex-col items-center">
                      <span className="font-bold text-white/60">SKIN</span>
                      <span className="font-bold text-white/80 uppercase truncate max-w-[100px]">
                        {SKINS.find(s => s.id === profile?.currentSkin)?.name || 'Default'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-3">
                  <motion.button
                    onClick={joinGame}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(255,255,255,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-4 bg-white text-black font-black text-xl rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    {isDead ? 'RESPAWN' : 'PLAY'}
                  </motion.button>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      onClick={() => setView('shop')}
                      whileHover={{ scale: 1.05, backgroundColor: 'rgb(63, 63, 70)' }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-4 bg-zinc-800 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3"
                    >
                      <ShoppingBag size={20} />
                      <span>SHOP</span>
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        useGameStore.getState().addNotification('Invite link copied!');
                      }}
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-4 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold rounded-2xl transition-all flex items-center justify-center gap-3"
                    >
                      <Share2 size={20} />
                      <span>INVITE</span>
                    </motion.button>
                  </div>
                </div>

                <div className="text-center text-white/40 text-[10px] uppercase tracking-[0.2em]">
                  Real-time multiplayer arena
                </div>

                {/* Admin Access Trigger */}
                <button 
                  onClick={() => setShowAdminLogin(true)}
                  className="mt-4 text-[9px] text-white/5 hover:text-white/20 transition-colors uppercase tracking-widest font-black"
                >
                  Admin Access
                </button>
              </div>
            ) : view === 'leaderboard' ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900/90 p-8 rounded-3xl border border-white/10 shadow-2xl max-w-2xl w-full flex flex-col"
              >
                <div className="flex justify-between items-center mb-8">
                  <motion.button 
                    onClick={() => setView('lobby')}
                    whileHover={{ scale: 1.2, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.8 }}
                    className="p-2 bg-white/5 rounded-full text-white transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </motion.button>
                  <h2 className="text-3xl font-black text-white italic tracking-tighter">GLOBAL RANKINGS</h2>
                  <Trophy size={24} className="text-yellow-400" />
                </div>

                <div className="flex bg-black/60 p-1.5 rounded-xl border border-white/10 mb-6 gap-2">
                  {(['live', 'daily', 'weekly', 'all-time'] as const).map((range, i) => (
                    <button
                      key={`range-btn-${range}-${i}`}
                      onClick={() => setLeaderboardRange(range)}
                      className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${
                        leaderboardRange === range 
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>

                <div className="overflow-y-auto pr-2 custom-scrollbar max-h-[50vh] flex flex-col gap-2">
                  {(leaderboardRange === 'live' ? gameState?.leaderboard : globalLeaderboard)?.map((entry, i) => (
                    <motion.div 
                      key={`leaderboard-entry-${leaderboardRange}-${entry.id || entry.uid || i}-${i}`}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        entry.uid === user.uid ? 'bg-white/10 border-white/40' : 'bg-black/40 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`text-xl font-black italic w-8 ${i < 3 ? 'text-yellow-400' : 'text-white/20'}`}>
                          #{i + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-lg">{entry.name}</span>
                          <span className="text-white/20 text-[10px] font-mono leading-none lowercase">{entry.uid === user.uid ? 'YOU' : 'SNAKE ACCOUNT'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-white font-mono">{entry.score}</span>
                        <span className="text-white/20 text-[10px] font-bold tracking-[0.2em]">SCORE</span>
                      </div>
                    </motion.div>
                  ))}
                  {((leaderboardRange === 'live' ? gameState?.leaderboard : globalLeaderboard)?.length === 0) && (
                    <div className="text-center py-12 text-white/20 font-bold italic tracking-wider">
                      NO DATA RECORDED YET
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-zinc-900/90 p-6 rounded-3xl border border-white/10 shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-6">
                  <motion.button 
                    onClick={() => setView('lobby')}
                    whileHover={{ scale: 1.2, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.8 }}
                    className="p-2 bg-white/5 rounded-full text-white transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </motion.button>
                  <h2 className="text-2xl font-black text-white italic">SKIN SHOP</h2>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                    <DollarSign size={16} className="text-yellow-400" />
                    <span className="font-mono font-bold text-white">{profile?.money}</span>
                  </div>
                </div>

                <div className="overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
                  {[...SKINS, ...customSkins].map((skin, i) => {
                    const isOwned = profile?.ownedSkins.includes(skin.id);
                    const isEquipped = profile?.currentSkin === skin.id;
                    const canAfford = (profile?.money || 0) >= skin.price;

                    return (
                      <motion.div 
                        key={`shop-item-${skin.id}-${i}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isEquipped ? { 
                          opacity: 1, 
                          scale: 1,
                          boxShadow: [
                            '0 0 0px rgba(255,255,255,0)', 
                            '0 0 20px rgba(255,255,255,0.2)', 
                            '0 0 0px rgba(255,255,255,0)'
                          ]
                        } : { opacity: 1, scale: 1 }}
                        transition={isEquipped ? {
                          boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        } : {}}
                        whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                          isEquipped ? 'bg-white/10 border-white/60 ring-1 ring-white/20' : 'bg-black/40 border-white/10'
                        }`}
                      >
                        {/* Preview */}
                        <div className="w-full aspect-square rounded-xl flex items-center justify-center relative overflow-hidden bg-zinc-800">
                          {skin.id === 'admin-neon' ? (
                            <div className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
                               <div className="absolute inset-0 bg-cyan-400 opacity-20 blur-xl animate-pulse" />
                               <div className="w-10 h-10 rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]" />
                               <div className="absolute top-2 w-8 h-8 rounded-full border-2 border-fuchsia-500 shadow-[0_0_10px_#d946ef]" />
                            </div>
                          ) : skin.id === 'kurdistan' ? (
                             <div className="flex flex-col w-full h-full rotate-45 scale-150">
                               <div className="h-1/3 bg-[#ED2124]" />
                               <div className="h-1/3 bg-white flex items-center justify-center">
                                 <div className="w-1/2 h-1/2 rounded-full bg-[#FFD700] blur-[1px]" />
                               </div>
                               <div className="h-1/3 bg-[#278E43]" />
                             </div>
                          ) : skin.id === 'realmadrid' ? (
                            <div className="w-full h-full bg-[#f0f0f0] flex items-center justify-center relative">
                               <div className="w-2/3 h-2/3 border-4 border-[#00529F] rounded-full flex items-center justify-center flex-col rotate-[-15deg]">
                                 <div className="w-5/6 h-2 bg-[#00529F] rotate-45 absolute" />
                                 <div className="text-[10px] font-black text-[#00529F] tracking-tighter">MCF</div>
                               </div>
                               <div className="absolute top-2 w-4 h-3 bg-yellow-400 rounded-t-full border border-yellow-600" />
                            </div>
                          ) : skin.id === 'usa' ? (
                            <div className="w-full h-full flex flex-col">
                              <div className="h-2/5 flex">
                                <div className="w-1/2 bg-[#3C3B6E] p-1 flex flex-wrap gap-0.5 items-center justify-center">
                                  {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={`usa-star-${i}`} className="w-0.5 h-0.5 bg-white rounded-full" />
                                  ))}
                                </div>
                                <div className="w-1/2 flex flex-col">
                                  <div className="h-1/4 bg-[#B22234]" />
                                  <div className="h-1/4 bg-white" />
                                  <div className="h-1/4 bg-[#B22234]" />
                                  <div className="h-1/4 bg-white" />
                                </div>
                              </div>
                              <div className="h-3/5 flex flex-col">
                                {Array.from({ length: 6 }).map((_, i) => (
                                  <div key={`usa-stripe-${i}`} className={`h-1/6 ${i % 2 === 0 ? 'bg-[#B22234]' : 'bg-white'}`} />
                                ))}
                              </div>
                            </div>
                          ) : skin.id === 'skull' ? (
                            <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center relative">
                               <div className="w-2/3 h-2/3 bg-white rounded-t-2xl rounded-b-lg relative flex flex-col items-center">
                                 <div className="flex gap-2 mt-4">
                                   <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_8px_red]" />
                                   <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_8px_red]" />
                                 </div>
                                 <div className="w-1/2 h-1 bg-black/20 mt-4 rounded-full" />
                               </div>
                            </div>
                          ) : skin.id === 'viking' ? (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center relative">
                               <div className="w-1/2 h-1/2 bg-gray-400 rounded-t-full relative">
                                 <div className="absolute -top-4 -left-2 w-4 h-6 bg-white rotate-[-30deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
                                 <div className="absolute -top-4 -right-2 w-4 h-6 bg-white rotate-[30deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
                               </div>
                            </div>
                          ) : skin.id === 'redcap' ? (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center relative">
                               <div className="w-1/2 h-2/5 bg-red-600 rounded-t-full relative">
                                 <div className="absolute bottom-0 -right-2 w-4 h-1 bg-red-600 rounded-full" />
                               </div>
                            </div>
                          ) : skin.id === 'crown' ? (
                            <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center relative">
                               <div className="w-1/2 h-1/4 bg-yellow-500 rounded-sm relative flex justify-between items-end px-1 pb-1">
                                 <div className="w-1 h-3 bg-yellow-500 [clip-path:polygon(50%_0%,0%_100%,100%_100%)] absolute -top-2 left-0" />
                                 <div className="w-1 h-3 bg-yellow-500 [clip-path:polygon(50%_0%,0%_100%,100%_100%)] absolute -top-2 left-1/2 -ms-0.5" />
                                 <div className="w-1 h-3 bg-yellow-500 [clip-path:polygon(50%_0%,0%_100%,100%_100%)] absolute -top-2 right-0" />
                               </div>
                            </div>
                          ) : skin.value.startsWith('http') ? (
                            <img src={skin.value} alt={skin.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse" style={{ backgroundColor: skin.value }} />
                          )}
                        </div>

                        <div className="text-center w-full">
                          <div className="text-white font-bold text-xs truncate mb-1">{skin.name}</div>
                          {isEquipped ? (
                            <button
                              disabled
                              className="w-full py-2 bg-green-500/20 text-green-400 rounded-lg text-[10px] font-black tracking-widest flex items-center justify-center gap-1 border border-green-500/30 cursor-default"
                            >
                              <Check size={12} />
                              EQUIPPED
                            </button>
                          ) : isOwned ? (
                            <motion.button
                              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSkin(skin.id)}
                              className="w-full py-2 bg-white/10 text-white rounded-lg text-[10px] font-black transition-colors"
                            >
                              EQUIP
                            </motion.button>
                          ) : (
                            <motion.button
                              disabled={!canAfford}
                              whileHover={canAfford ? { scale: 1.05 } : {}}
                              whileTap={canAfford ? { scale: 0.95 } : {}}
                              onClick={() => buySkin(skin.id)}
                              className={`w-full py-2 rounded-lg text-[10px] font-black transition-all ${
                                canAfford 
                                  ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.4)]' 
                                  : 'bg-zinc-800 text-white/20 cursor-not-allowed'
                              }`}
                            >
                              {skin.price === 0 ? 'FREE' : `$${skin.price}`}
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gameplay HUD elements on top */}
      <div className="absolute inset-0 pointer-events-none z-[110]">
        {/* Minimap */}
        {isAlive && showMinimap && (
          <>
            <div className="absolute bottom-4 right-4 hidden md:block pointer-events-auto">
              <Minimap gameState={gameState} currentPlayerId={playerId} />
            </div>
            <div className="absolute top-2 right-4 md:hidden scale-75 origin-top-right pointer-events-auto">
              <Minimap gameState={gameState} currentPlayerId={playerId} />
            </div>
          </>
        )}

        {/* Leaderboard HUD - Live only */}
        {isAlive && showHUDLeaderboard && (
          <div className="absolute top-20 right-4 w-60 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 pointer-events-auto">
            <div className="flex flex-col gap-3 mb-4">
              <h3 className="text-white font-black italic tracking-wider text-sm flex items-center gap-2">
                <Trophy size={14} className="text-yellow-400" />
                LIVE RANKINGS
              </h3>
            </div>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {gameState?.leaderboard.map((entry, i) => (
                <motion.div 
                  key={`hud-leaderboard-entry-${entry.id || entry.uid || i}-${i}`} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex justify-between items-center text-sm px-1 rounded ${entry.uid === user.uid ? 'bg-white/10 ring-1 ring-white/20' : ''}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-white/40 w-4 text-[10px]">{i + 1}.</span>
                    <span style={{ color: (entry as any).color || '#fff' }} className="font-medium truncate max-w-[120px]">
                      {entry.name}
                    </span>
                  </div>
                  <span className="font-mono text-white/80 tabular-nums">{entry.score}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Kill Notifications Overlay */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col gap-2">
          <AnimatePresence>
            {notifications.map((notif, i) => (
              <motion.div
                key={`notification-${notif.id}-${i}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full text-white font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {notif.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
