/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Group, GroupPredictionStore, Match, TestSimulationReport } from './types';
import { TEAMS, GROUP_ALPHABETS, GROUP_TEAMS, INITIAL_GROUP_MATCHES, INITIAL_KNOCKOUT_MATCHES } from './data/teamsAndMatches';
import { runCompleteQASimulation } from './utils/simulator';
import { calculateGroupStandings } from './utils/tiebreakers';
import Regulation from './components/Regulation';
import MyGroups from './components/MyGroups';
import GroupDetails from './components/GroupDetails';
import AdminPanel from './components/AdminPanel';
// @ts-ignore
import bgProde from './assets/images/bg_prode_1779565282229.png';
import {
  Trophy,
  Users,
  BookOpen,
  Settings,
  Home,
  UserCheck,
  LogOut,
  Mail,
  Lock,
  Compass,
  Zap,
  Play,
  RotateCcw,
  CheckCircle,
  Clock,
  Menu,
  X,
  Check,
  Edit3
} from 'lucide-react';

// Firebase imports
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  writeBatch,
  collectionGroup,
  getDoc,
  getDocFromServer,
  getDocs
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Firestore Connection on Boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

const LOCAL_STORAGE_KEYS = {
  SIM_REPORT: 'prode_26_sim_report'
};

export default function App() {
  // Navigation State
  const [activePage, setActivePage] = useState<'home' | 'grupos' | 'reglamento' | 'admin' | 'auth'>('home');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication Flows
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'verify'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState('');
  const [verificationInputCode, setVerificationInputCode] = useState('');
  const [lastSentCode, setLastSentCode] = useState('');
  const [isSmtpConfigured, setIsSmtpConfigured] = useState(false);

  // Domain State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Record<string, GroupPredictionStore>>>({});
  const [matches, setMatches] = useState<Match[]>([]);
  
  // Game Lock states
  const [locks, setLocks] = useState({
    isGroupStageLocked: false,
    isKnockoutStageLocked: false,
    isGroupCreationLocked: false,
    isKnockoutPhaseVisible: false
  });

  // Ground truth actual extras
  const [actualExtras, setActualExtras] = useState({
    championTeamId: '',
    topScorer: '',
    mvp: '',
    surpriseTeamId: '',
    disappointmentTeamId: ''
  });

  // QA / Simulation State metrics
  const [simulationReport, setSimulationReport] = useState<TestSimulationReport | null>(null);

  // User Header Edit Nickname State
  const [isEditingHeaderNickname, setIsEditingHeaderNickname] = useState(false);
  const [tempHeaderNickname, setTempHeaderNickname] = useState('');

  // Bootstrap Database Defaults in Firestore (Executed only if DB matches/locks are empty)
  const initializeDatabaseDefaults = async () => {
    try {
      const batch = writeBatch(db);
      const initialMatchesList = [
        ...INITIAL_GROUP_MATCHES,
        ...INITIAL_KNOCKOUT_MATCHES
      ];
      initialMatchesList.forEach((m) => {
        batch.set(doc(db, 'matches', m.id), m);
      });

      batch.set(doc(db, 'locks', 'global'), {
        isGroupStageLocked: false,
        isKnockoutStageLocked: false,
        isGroupCreationLocked: false,
        isKnockoutPhaseVisible: false
      });

      batch.set(doc(db, 'extras', 'global'), {
        championTeamId: '',
        topScorer: '',
        mvp: '',
        surpriseTeamId: '',
        disappointmentTeamId: ''
      });

      batch.set(doc(db, 'groups', 'group_family_scaloneta'), {
        id: 'group_family_scaloneta',
        name: 'Familia Scaloneta ⭐️⭐️⭐️',
        inviteCode: 'SCALONETA26',
        ownerId: auth.currentUser?.uid || 'bootstrapped_default',
        memberIds: [auth.currentUser?.uid || 'bootstrapped_default'],
        requiresApproval: false,
        pendingMemberIds: []
      });

      await batch.commit();
      console.log("[Firebase Core] Inicialización exitosa de base de datos.");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'initializeDatabaseDefaults');
    }
  };

  // 1. Authentication Listener (Firebase Auth)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDocRef = doc(db, 'users', authUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const dbUser = userSnap.data() as User;
            
            // Core check: is standard user account verified in Firestore database?
            if (dbUser.verified === false) {
              setVerifyingEmail(dbUser.email || authUser.email || '');
              setCurrentUser(null);
              setActivePage('auth');
              setAuthMode('verify');
              return;
            }
            
            setCurrentUser(dbUser);
          } else {
            // New sign in, typically with Google authentication
            const isFirstBootstrappedAdmin = authUser.email === 'rodrigo.s@lynchnet.com.ar' || authUser.email === 'prodeonline.rs@gmail.com';
            const newUser: User = {
              id: authUser.uid,
              name: authUser.displayName || authUser.email?.split('@')[0] || 'Competidor',
              email: authUser.email || '',
              registerDate: new Date().toISOString(),
              isAdmin: isFirstBootstrappedAdmin,
              scoreByGroup: {},
              verified: true
            };
            await setDoc(userDocRef, newUser);
            setCurrentUser(newUser);
          }
          setActivePage('home');
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${authUser.uid}`);
        }
      } else {
        setCurrentUser(null);
        setActivePage('auth');
      }
    });

    // Query SMTP status (retained for backend checks if any)
    fetch('/api/smtp-status')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.configured === 'boolean') {
          setIsSmtpConfigured(data.configured);
        }
      })
      .catch(err => {
        console.error("[SMTP Check] SMTP verification failed:", err);
      });

    return () => unsubAuth();
  }, []);

  // 2. Real-time Database Snapshot Sync (Firestore)
  useEffect(() => {
    if (!currentUser) return;

    // A. Sync Users List
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const nextUsers: Record<string, User> = {};
      snap.forEach((d) => {
        nextUsers[d.id] = d.data() as User;
      });
      setUsers(nextUsers);

      // Keep currentUser state in sync in real-time if they update their nickname (apodo) or score
      if (currentUser?.id && nextUsers[currentUser.id]) {
        const dbUser = nextUsers[currentUser.id];
        if (
          dbUser.name !== currentUser.name ||
          dbUser.isAdmin !== currentUser.isAdmin ||
          JSON.stringify(dbUser.scoreByGroup) !== JSON.stringify(currentUser.scoreByGroup)
        ) {
          setCurrentUser(dbUser);
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));

    // B. Sync Groups
    const unsubGroups = onSnapshot(collection(db, 'groups'), (snap) => {
      const nextGroups: Group[] = [];
      snap.forEach((d) => {
        nextGroups.push(d.data() as Group);
      });
      setGroups(nextGroups);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'groups'));

    // C. Sync Matches (Populate defaults if database matches list is blank)
    const unsubMatches = onSnapshot(collection(db, 'matches'), (snap) => {
      const nextMatches: Match[] = [];
      snap.forEach((d) => {
        nextMatches.push(d.data() as Match);
      });
      if (nextMatches.length > 0) {
        setMatches(nextMatches);
      } else if (currentUser.isAdmin) {
        initializeDatabaseDefaults();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'matches'));

    // D. Sync Global Locks
    const unsubLocks = onSnapshot(doc(db, 'locks', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setLocks(docSnap.data() as any);
      } else if (currentUser.isAdmin) {
        setDoc(doc(db, 'locks', 'global'), {
          isGroupStageLocked: false,
          isKnockoutStageLocked: false,
          isGroupCreationLocked: false,
          isKnockoutPhaseVisible: false
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'locks/global'));

    // E. Sync Ground Truth Extras
    const unsubExtras = onSnapshot(doc(db, 'extras', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setActualExtras(docSnap.data() as any);
      } else if (currentUser.isAdmin) {
        setDoc(doc(db, 'extras', 'global'), {
          championTeamId: '',
          topScorer: '',
          mvp: '',
          surpriseTeamId: '',
          disappointmentTeamId: ''
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'extras/global'));

    // F. Sync Collection Group Predictions
    const unsubPreds = onSnapshot(collectionGroup(db, 'predictions'), (snap) => {
      const nextPredictions: Record<string, Record<string, GroupPredictionStore>> = {};
      snap.forEach((d) => {
        const parts = d.ref.path.split('/');
        if (parts.length >= 4) {
          const uId = parts[1];
          const gId = parts[3];
          if (!nextPredictions[uId]) {
            nextPredictions[uId] = {};
          }
          nextPredictions[uId][gId] = d.data() as GroupPredictionStore;
        }
      });
      setPredictions(nextPredictions);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'collectionGroup:predictions'));

    // G. Sync simulation report if saved of client browser
    const savedSimReport = localStorage.getItem(LOCAL_STORAGE_KEYS.SIM_REPORT);
    if (savedSimReport) {
      setSimulationReport(JSON.parse(savedSimReport));
    }

    return () => {
      unsubUsers();
      unsubGroups();
      unsubMatches();
      unsubLocks();
      unsubExtras();
      unsubPreds();
    };
  }, [currentUser?.id, currentUser?.isAdmin]);

  // Helper inside groups list
  const getActiveGroupObj = () => {
    return groups.find((g) => g.id === activeGroupId) || null;
  };

  // Update Competitor Nickname
  const handleUpdateNickname = async (newNickname: string) => {
    if (!currentUser || !newNickname.trim()) return;
    const cleanName = newNickname.trim();
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { name: cleanName });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.id}`);
    }
  };

  // Update Group Name (Owner only check enforced in component)
  const handleUpdateGroupName = async (groupId: string, newName: string) => {
    const cleanName = newName.trim();
    if (!cleanName) return;
    try {
      await updateDoc(doc(db, 'groups', groupId), { name: cleanName });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${groupId}`);
    }
  };

  // Google Single-Sign-In Handler
  const handleGoogleSignIn = async () => {
    setAuthError('');
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      const authUser = res.user;
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          const isFirstBootstrappedAdmin = authUser.email === 'rodrigo.s@lynchnet.com.ar' || authUser.email === 'prodeonline.rs@gmail.com';
          const newUser: User = {
            id: authUser.uid,
            name: authUser.displayName || authUser.email?.split('@')[0] || 'Competidor',
            email: authUser.email || '',
            registerDate: new Date().toISOString(),
            isAdmin: isFirstBootstrappedAdmin,
            scoreByGroup: {},
            verified: true
          };
          await setDoc(userDocRef, newUser);
          setCurrentUser(newUser);
        } else {
          setCurrentUser(userSnap.data() as User);
        }
        setActivePage('home');
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Error en autenticación de Google');
    }
  };

  // Email-Password Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail.trim() || !authPassword) {
      setAuthError('Por favor, ingresá correo y contraseña.');
      return;
    }

    const emailNormalized = authEmail.trim().toLowerCase();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailNormalized, authPassword);
      const authUser = userCredential.user;
      const userRef = doc(db, 'users', authUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setCurrentUser(userSnap.data() as User);
      } else {
        const newUser: User = {
          id: authUser.uid,
          name: authEmail.split('@')[0],
          email: emailNormalized,
          registerDate: new Date().toISOString(),
          isAdmin: emailNormalized === 'rodrigo.s@lynchnet.com.ar' || emailNormalized === 'prodeonline.rs@gmail.com',
          scoreByGroup: {},
          verified: true
        };
        await setDoc(userRef, newUser);
        setCurrentUser(newUser);
      }
      setActivePage('home');
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      console.error(err);
      const errMsg = (err.message || '').toLowerCase();
      const errCode = (err.code || '').toLowerCase();

      if (
        errCode === 'auth/user-not-found' || 
        errCode === 'auth/wrong-password' || 
        errCode === 'auth/invalid-credential' ||
        errMsg.includes('user-not-found') ||
        errMsg.includes('wrong-password') ||
        errMsg.includes('invalid-credential') ||
        errMsg.includes('invalid credential')
      ) {
        setAuthError('Credenciales incorrectas o usuario no encontrado.');
      } else if (
        errCode === 'auth/invalid-email' || 
        errMsg.includes('invalid-email') || 
        errMsg.includes('invalid email')
      ) {
        setAuthError('La dirección de correo ingresada no es válida.');
      } else {
        setAuthError('Error de autenticación: verifique los datos o acceda con Google.');
      }
    }
  };

  // Email-Password Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authName.trim() || !authEmail.trim() || !authPassword || !authConfirmPassword) {
      setAuthError('Completá todos los campos de registro.');
      return;
    }

    if (authPassword !== authConfirmPassword) {
      setAuthError('Las contraseñas no coinciden.');
      return;
    }

    const emailNormalized = authEmail.trim().toLowerCase();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailNormalized, authPassword);
      const authUser = userCredential.user;

      // Generate a clean 6-digit email confirmation code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const newUserObj: User = {
        id: authUser.uid,
        name: authName.trim(),
        email: emailNormalized,
        registerDate: new Date().toISOString(),
        isAdmin: emailNormalized === 'rodrigo.s@lynchnet.com.ar' || emailNormalized === 'prodeonline.rs@gmail.com',
        scoreByGroup: {},
        verified: false,
        verificationCode: verificationCode
      };

      await setDoc(doc(db, 'users', authUser.uid), newUserObj);

      // Send customized high-fidelity confirmation email using Nodemailer API
      let emailSendErrorMsg = '';
      
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: emailNormalized,
            subject: '🏆 PRODE ONLINE - Confirmación de Cuenta de Usuario',
            text: `¡Hola ${authName.trim()}! Para finalizar tu registro y empezar a ingresar tus predicciones de partidos en tus grupos competitivos, utilizá el siguiente código de confirmación: ${verificationCode}.`,
            template: 'verification',
            name: authName.trim(),
            code: verificationCode
          })
        });
      
        const responseText = await response.text();
      
        console.log("SMTP RESPONSE:", responseText);
      
        let mailRes: any = {};
      
        try {
          mailRes = JSON.parse(responseText);
        } catch {
          throw new Error(responseText);
        }
      
        if (!response.ok) {
          emailSendErrorMsg =
            mailRes.details ||
            mailRes.error ||
            responseText ||
            'Error SMTP desconocido del servidor.';
        } else if (mailRes.simulated) {
          setLastSentCode(verificationCode);
        }
      
      } catch (mailErr: any) {
        console.error('Error al enviar correo de confirmación de cuenta:', mailErr);
      
        emailSendErrorMsg =
          mailErr.message ||
          'Error de conexión de red al intentar contactar al servidor de correo.';
      }

      setAuthName('');
      setAuthEmail('');
      setAuthPassword('');
      setAuthConfirmPassword('');
      setVerifyingEmail(emailNormalized);
      setAuthMode('verify');

      if (emailSendErrorMsg) {
        alert(
          `⚠️ ¡Cuenta creada en Firebase pero falló el envío de correo!\n\n` +
          `Error SMTP del servidor:\n"${emailSendErrorMsg}"\n\n` +
          `Sugerencias de solución:\n` +
          `1. Si usás Gmail, debés activar la Verificación en 2 Pasos y generar una "Contraseña de Aplicación" de 16 caracteres. NO uses tu contraseña de login normal en SMTP_PASS.\n` +
          `2. Asegurá que SMTP_PORT sea 587 (con SMTP_SECURE=false) o 465 (con SMTP_SECURE=true).\n` +
          `3. Algunos hosts de mail bloquean accesos desde IPs de servidores en la nube como Vercel si no tienen seguridad SSL/TLS bien definida.`
        );
      } else {
        alert('¡Cuenta registrada con éxito! Te enviamos un código de confirmación de 6 dígitos a tu correo para activar tu cuenta.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = (err.message || '').toLowerCase();
      const errCode = (err.code || '').toLowerCase();

      const isEmailInUse = 
        errCode === 'auth/email-already-in-use' || 
        errCode.includes('already-in-use') ||
        errCode.includes('already_in_use') ||
        errMsg.includes('email-already-in-use') || 
        errMsg.includes('already-in-use') ||
        errMsg.includes('already_in_use') ||
        errMsg.includes('already in use');

      if (isEmailInUse) {
        // Fallback: If registration fails but the email is already in Firebase Auth,
        // we try to sign them in using the password they just provided.
        // If it succeeds, it means they are the legitimate owner and we can seamlessly rebuild their deleted Firestore profile if missing.
        try {
          await signInWithEmailAndPassword(auth, emailNormalized, authPassword);
          setAuthName('');
          setAuthEmail('');
          setAuthPassword('');
          setAuthConfirmPassword('');
          alert('¡Hola! Esta cuenta ya estaba registrada en el sistema de autenticación de Firebase. Iniciamos tu sesión de forma segura.');
        } catch (signInErr) {
          setAuthError(
            'Esta dirección de correo ya se encuentra registrada. ' +
            'Si anteriormente eliminaste tu cuenta, tu perfil de juego (Firestore) fue purgado con éxito pero tu credencial de acceso de Firebase Auth persiste debido a restricciones de la Sandbox de Google Cloud. ' +
            'Por favor, ingresá desde la pantalla principal utilizando tu correo y tu contraseña habitual, o recuperá tu contraseña si no la recordás.'
          );
        }
      } else if (
        errCode === 'auth/weak-password' || 
        errMsg.includes('weak-password') || 
        errMsg.includes('weak password')
      ) {
        setAuthError('La contraseña debe tener un mínimo de 6 caracteres.');
      } else if (
        errCode === 'auth/invalid-email' || 
        errMsg.includes('invalid-email') || 
        errMsg.includes('invalid email')
      ) {
        setAuthError('La dirección de correo ingresada no es válida.');
      } else {
        setAuthError(err.message || 'Error al crear la cuenta.');
      }
    }
  };

  // Verify 6-digit confirmation OTP entered by user
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!verificationInputCode.trim()) {
      setAuthError('Por favor, ingresá el código de confirmación.');
      return;
    }

    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const dbUser = userSnap.data() as User;
          if (dbUser.verificationCode === verificationInputCode.trim()) {
            await updateDoc(userDocRef, { verified: true });
            
            // Get latest user document showing as verified
            const updatedSnap = await getDoc(userDocRef);
            if (updatedSnap.exists()) {
              setCurrentUser(updatedSnap.data() as User);
            }
            setActivePage('home');
            alert('✅ ¡Tu cuenta ha sido verificada y activada con éxito! Bienvenido al Prode Mundial 2026.');
          } else {
            setAuthError('Código de confirmación incorrecto. Por favor, verificarlo y reintentar.');
          }
        } else {
          setAuthError('No se encontró información del perfil de usuario.');
        }
      } catch (err: any) {
        setAuthError('No se pudo verificar el estado: ' + err.message);
      }
    } else {
      alert('La sesión expiró o es inválida. Por favor, iniciá sesión nuevamente.');
      setAuthMode('login');
    }
  };

  // Resend 6-digit confirmation OTP to the user's email via Nodemailer
  const handleResendVerifyCode = async () => {
    setAuthError('');
    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const dbUser = userSnap.data() as User;
          const newCode = Math.floor(100000 + Math.random() * 900000).toString();
          
          await updateDoc(userDocRef, { verificationCode: newCode });

          let emailSendErrorMsg = '';
          try {
            const response = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: dbUser.email,
                subject: '🏆 PRODE ONLINE - Confirmación de Cuenta de Usuario',
                text: `¡Hola ${dbUser.name}! Para finalizar tu registro y empezar a ingresar tus predicciones de partidos en tus grupos competitivos, utilizá el siguiente código de confirmación: ${newCode}.`,
                template: 'verification',
                name: dbUser.name,
                code: newCode
              })
            });
            const mailRes = await response.json();
            if (!response.ok) {
              emailSendErrorMsg = mailRes.details || mailRes.error || 'Error SMTP desconocido del servidor.';
            } else if (mailRes.simulated) {
              setLastSentCode(newCode); // Offline bypass helper
            }
          } catch (mailErr: any) {
            console.error('Error al reenviar correo de confirmación de cuenta:', mailErr);
            emailSendErrorMsg = mailErr.message || 'Error de conexión de red al intentar contactar al servidor de correo.';
          }

          setVerificationInputCode('');
          if (emailSendErrorMsg) {
            alert(
              `⚠️ ¡Código generado pero falló el envío del correo!\n\n` +
              `Error SMTP del servidor:\n"${emailSendErrorMsg}"\n\n` +
              `Por favor, verificá tus secretos de SMTP configurados en Vercel.`
            );
          } else {
            alert('📬 Código de verificación reenviado con éxito. Por favor, revisá tu bandeja de entrada o spam.');
          }
        }
      } catch (err: any) {
        setAuthError('No se pudo reenviar el correo: ' + err.message);
      }
    } else {
      alert('Sesión no encontrada. Por favor, ingresá con tu correo de contraseña primero.');
      setAuthMode('login');
    }
  };

  // Back to login from verify state (signs out current user to clean up state)
  const handleBackToLoginFromVerify = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
    setAuthMode('login');
    setAuthError('');
  };

  // For forgot password flow using real Firebase Auth reset triggers
  const handleForgotFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail.trim()) {
      setAuthError('Ingresá tu correo para el restablecimiento.');
      return;
    }

    const emailNormalized = authEmail.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, emailNormalized);
      alert(`Se ha enviado un correo electrónico con instrucciones de recuperación de cuenta para: ${emailNormalized}.`);
      setAuthMode('login');
      setAuthError('');
    } catch (err: any) {
      console.error(err);
      setAuthError('No se pudo procesar el restablecimiento. Verifique el correo ingresado.');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
    setCurrentUser(null);
    setActivePage('auth');
    setAuthMode('login');
    setActiveGroupId(null);
  };

  // Create Group Handler
  const handleCreateGroup = async (name: string, requiresApproval: boolean) => {
    if (!currentUser) return;
    
    const inviteCode = `CODE-${Math.random().toString(36).substring(3, 8).toUpperCase()}`;
    const nextGroupId = `group_${Date.now()}`;
    const newGroupObj: Group = {
      id: nextGroupId,
      name,
      inviteCode,
      ownerId: currentUser.id,
      memberIds: [currentUser.id],
      requiresApproval,
      pendingMemberIds: []
    };

    try {
      await setDoc(doc(db, 'groups', nextGroupId), newGroupObj);
      setActiveGroupId(nextGroupId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `groups/${nextGroupId}`);
    }
  };

  // Join Group via Code
  const handleJoinByCode = async (inviteCode: string) => {
    if (!currentUser) return;

    const matched = groups.find((g) => g.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase());
    if (!matched) {
      alert('Código de invitación no válido o inexistente.');
      return;
    }

    if (matched.memberIds.includes(currentUser.id)) {
      alert('Ya formas parte de este grupo.');
      setActiveGroupId(matched.id);
      return;
    }

    const pendingList = matched.pendingMemberIds || [];
    if (pendingList.includes(currentUser.id)) {
      alert('Tu solicitud ya se encuentra pendiente de aprobación por el administrador de este grupo.');
      return;
    }

    try {
      const groupRef = doc(db, 'groups', matched.id);
      if (matched.requiresApproval) {
        await updateDoc(groupRef, {
          pendingMemberIds: [...pendingList, currentUser.id]
        });
        alert(`¡Solicitud enviada! El grupo "${matched.name}" requiere aprobación de su creador. Aguarda a ser aceptado.`);
      } else {
        await updateDoc(groupRef, {
          memberIds: [...matched.memberIds, currentUser.id]
        });
        setActiveGroupId(matched.id);
        alert(`¡Te uniste correctamente al grupo "${matched.name}"!`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${matched.id}`);
    }
  };

  // Leave active group
  const handleExitGroup = async (groupId: string) => {
    if (!currentUser) return;
    const matched = groups.find((g) => g.id === groupId);
    if (!matched) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        memberIds: matched.memberIds.filter((id) => id !== currentUser.id),
        pendingMemberIds: (matched.pendingMemberIds || []).filter((id) => id !== currentUser.id)
      });
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${groupId}`);
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteDoc(doc(db, 'groups', groupId));
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `groups/${groupId}`);
    }
  };

  // Group Creators: Accept pending membership requests
  const handleAcceptPendingUser = async (groupId: string, userId: string) => {
    const matched = groups.find((g) => g.id === groupId);
    if (!matched) return;

    const pending = matched.pendingMemberIds || [];
    const members = matched.memberIds || [];
    const nextMembers = members.includes(userId) ? members : [...members, userId];

    try {
      await updateDoc(doc(db, 'groups', groupId), {
        memberIds: nextMembers,
        pendingMemberIds: pending.filter((id) => id !== userId)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${groupId}`);
    }
  };

  // Group Creators: Reject pending membership requests
  const handleRejectPendingUser = async (groupId: string, userId: string) => {
    const matched = groups.find((g) => g.id === groupId);
    if (!matched) return;

    const pending = matched.pendingMemberIds || [];
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        pendingMemberIds: pending.filter((id) => id !== userId)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${groupId}`);
    }
  };

  // Group Creators: Remove members from a specific group
  const handleRemoveUserFromGroup = async (groupId: string, userId: string) => {
    const matched = groups.find((g) => g.id === groupId);
    if (!matched) return;

    try {
      await updateDoc(doc(db, 'groups', groupId), {
        memberIds: matched.memberIds.filter((id) => id !== userId),
        pendingMemberIds: (matched.pendingMemberIds || []).filter((id) => id !== userId)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${groupId}`);
    }
  };

  // Update Match Prediction (User level)
  const handleUpdatePrediction = async (matchId: string, team1Goals: number | null, team2Goals: number | null) => {
    if (!currentUser || !activeGroupId) return;

    const predRef = doc(db, 'users', currentUser.id, 'predictions', activeGroupId);
    
    const userPreds = predictions[currentUser.id] || {};
    const groupPreds = userPreds[activeGroupId] || {
      matches: {},
      extras: { championTeamId: '', topScorer: '', mvp: '', surpriseTeamId: '', disappointmentTeamId: '' }
    };

    groupPreds.matches[matchId] = {
      team1Goals,
      team2Goals
    };

    try {
      await setDoc(predRef, groupPreds);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.id}/predictions/${activeGroupId}`);
    }
  };

  // Update Extras Prediction (User level)
  const handleUpdateExtrasPrediction = async (field: string, value: string) => {
    if (!currentUser || !activeGroupId) return;

    const predRef = doc(db, 'users', currentUser.id, 'predictions', activeGroupId);

    const userPreds = predictions[currentUser.id] || {};
    const groupPreds = userPreds[activeGroupId] || {
      matches: {},
      extras: { championTeamId: '', topScorer: '', mvp: '', surpriseTeamId: '', disappointmentTeamId: '' }
    };

    (groupPreds.extras as any)[field] = value;

    try {
      await setDoc(predRef, groupPreds);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.id}/predictions/${activeGroupId}`);
    }
  };

  // Admin capabilities: Save official match result in system
  const handleUpdateMatchActualResult = async (matchId: string, team1Goals: number | null, team2Goals: number | null) => {
    try {
      await updateDoc(doc(db, 'matches', matchId), { team1Goals, team2Goals });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `matches/${matchId}`);
    }
  };

  // Admin capability: Modify match date/time
  const handleUpdateMatchDateTime = async (matchId: string, date: string, time: string) => {
    try {
      await updateDoc(doc(db, 'matches', matchId), { date, time });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `matches/${matchId}`);
    }
  };

  // Admin capability: Rename team names dynamically
  const handleUpdateTeamName = (teamId: string, newName: string) => {
    const teamObj = TEAMS[teamId];
    if (teamObj) {
      teamObj.name = newName;
      // Force trigger local matches array state clone to redraw React tree
      setMatches([...matches]);
    }
  };

  // Admin capability: Auto generate 16avos playoffs bracket
  const handleGenerateBracketElements = async () => {
    // Collect standings of the 12 groups A to L
    const firsts: string[] = [];
    const seconds: string[] = [];
    const thirds: Array<{ teamId: string; pts: number; dg: number }> = [];

    GROUP_ALPHABETS.forEach((grpLetter) => {
      const standings = GROUP_TEAMS[grpLetter]
        ? calculateGroupStandings(grpLetter, GROUP_TEAMS[grpLetter], matches)
        : [];
      if (standings.length >= 3) {
        firsts.push(standings[0].teamId);
        seconds.push(standings[1].teamId);
        thirds.push({
          teamId: standings[2].teamId,
          pts: standings[2].pts,
          dg: standings[2].dg
        });
      }
    });

    // Sort candidates thirds
    thirds.sort((a,b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      return b.dg - a.dg;
    });

    const bestEightThirds = thirds.slice(0, 8).map((x) => x.teamId);
    const all32Classified = [...firsts, ...seconds, ...bestEightThirds];

    let matchIdx = 0;
    const nextMatches = matches.map((m) => {
      if (m.group === '16avos' && m.id === `k32_${matchIdx + 1}`) {
        const t1 = all32Classified[matchIdx * 2] || '';
        const t2 = all32Classified[matchIdx * 2 + 1] || '';
        matchIdx++;
        return {
          ...m,
          team1: t1,
          team2: t2
        };
      }
      return m;
    });

    try {
      const batch = writeBatch(db);
      nextMatches.forEach((m) => {
        batch.set(doc(db, 'matches', m.id), m);
      });
      await batch.commit();
      alert('🏆 ¡Bracket de Fase Eliminatoria (16avos) programado de forma automática con todos las posiciones en tiempo real!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'matches');
    }
  };

  // Admin capability: Toggle locks for different steps
  const handleToggleLock = async (stage: 'group' | 'knockout' | 'groupCreation' | 'knockoutPhaseVisible') => {
    const locksRef = doc(db, 'locks', 'global');
    try {
      await updateDoc(locksRef, {
        isGroupStageLocked: stage === 'group' ? !locks.isGroupStageLocked : locks.isGroupStageLocked,
        isKnockoutStageLocked: stage === 'knockout' ? !locks.isKnockoutStageLocked : locks.isKnockoutStageLocked,
        isGroupCreationLocked: stage === 'groupCreation' ? !locks.isGroupCreationLocked : locks.isGroupCreationLocked,
        isKnockoutPhaseVisible: stage === 'knockoutPhaseVisible' ? !locks.isKnockoutPhaseVisible : locks.isKnockoutPhaseVisible,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'locks/global');
    }
  };

  // Admin capability: Delete user from list (purges profile, group associations and subcollection predictions)
  const handleDeleteUser = async (userId: string) => {
    const targetUser = users[userId];
    const targetName = targetUser?.name || 'Usuario';
    const targetEmail = targetUser?.email || 'sin correo';

    let isAuthSimulated = false;
    let authWarning = '';

    try {
      // 1. First delete the user from Firebase Authentication via our secure admin backend endpoint
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/admin/delete-auth-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ uid: userId })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.warn('Advertencia al eliminar la cuenta de autenticación de Firebase (procediendo con la purga de documentos):', errData);
        } else {
          const resData = await response.json().catch(() => ({}));
          if (resData.simulated) {
            isAuthSimulated = true;
            authWarning = resData.warning || '';
            console.log(`⚠️ [Firebase Auth] Simulación (API Deshabilitada): ${resData.message}`);
          } else {
            console.log(`✅ [Firebase Auth] Cuenta asociada a ${targetEmail} eliminada correctamente.`);
          }
        }
      } catch (authErr) {
        console.error('Error de red al intentar eliminar cuenta de autenticación:', authErr);
      }

      // 2. Fetch all predictions under users/{userId}/predictions subcollection in Firestore
      const userRef = doc(db, 'users', userId);
      const predsRef = collection(db, 'users', userId, 'predictions');
      const predsSnap = await getDocs(predsRef);

      const batch = writeBatch(db);

      // 3. Queue all individual prediction documents for deletion
      predsSnap.docs.forEach((pDoc) => {
        batch.delete(pDoc.ref);
      });

      // 4. Queue the main user document for deletion
      batch.delete(userRef);

      // 5. Update and mutate any group where this user was a member, pending member, or owner
      groups.forEach((g) => {
        const isMember = g.memberIds.includes(userId);
        const isPending = g.pendingMemberIds && g.pendingMemberIds.includes(userId);
        const isOwner = g.ownerId === userId;

        if (isMember || isPending || isOwner) {
          const updatedMembers = g.memberIds.filter(id => id !== userId);
          // If the deleted user is the owner, re-assign owner to the first remaining member or a fallback 'admin'
          const updatedOwner = isOwner ? (updatedMembers[0] || 'admin') : g.ownerId;
          
          batch.update(doc(db, 'groups', g.id), {
            memberIds: updatedMembers,
            pendingMemberIds: (g.pendingMemberIds || []).filter(id => id !== userId),
            ownerId: updatedOwner
          });
        }
      });

      // 6. Commit all deletions and updates atomically
      await batch.commit();

      if (isAuthSimulated) {
        alert(
          `¡Éxito! Todo lo relacionado con ${targetName} (${targetEmail}) ha sido eliminado permanentemente de la base de datos Firestore (perfil, grupos y predicciones).\n\n` +
          `ℹ NOTA DE AUTENTICACIÓN:\n${authWarning}`
        );
      } else {
        alert(`¡Todo lo relacionado con ${targetName} (${targetEmail}) ha sido eliminado permanentemente de Firebase con éxito!`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  };

  // Admin capability: Modify actual extras category
  const handleUpdateActualExtras = async (field: string, value: string) => {
    try {
      await updateDoc(doc(db, 'extras', 'global'), { [field]: value });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'extras/global');
    }
  };

  // QA TRIGGER: Run complete 50-user multi-level World Cup simulation (Kept in React state to avoid exhaustion)
  const handleTriggerSimulation = () => {
    const principalEmail = currentUser?.email || 'prodeonline.rs@gmail.com';
    const principalName = currentUser?.name || 'Rodrigo Romero';

    const simOutput = runCompleteQASimulation(principalEmail, principalName);

    // Save outputs in states
    setUsers(simOutput.simulatedUsers);
    setGroups(simOutput.simulatedGroups);
    setPredictions(simOutput.simulatedPredictions);
    setMatches(simOutput.simulatedMatches);
    setActualExtras(simOutput.actualExtras);
    setSimulationReport(simOutput.report);

    // Save simulation report in localStorage
    localStorage.setItem(LOCAL_STORAGE_KEYS.SIM_REPORT, JSON.stringify(simOutput.report));

    if (simOutput.simulatedGroups.length > 0) {
      setActiveGroupId(simOutput.simulatedGroups[0].id);
    }
    setActivePage('grupos');
    alert('⚡ ¡Simulación Completa ejecutada con éxito! Se cargaron 50 competidores simulados, 6 ligas independientes del Prode, 72 partidos jugados con goles alternativos ponderados, resultados clasificatorios, y un informe completo de control de tiebreakers.');
  };

  // QA CLEANUP: Reset all testing simulation metrics
  const handleResetData = async () => {
    try {
      await signOut(auth);
    } catch (err) {}
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SIM_REPORT);
    setSimulationReport(null);
    setCurrentUser(null);
    setActivePage('auth');
    setActiveGroupId(null);
    alert('¡Limpieza completada con éxito!');
  };

  return (
    <div className="min-h-screen bg-[#001D3D] font-sans flex flex-col relative pb-20 md:pb-6 overflow-x-hidden text-slate-100">
      
      {/* Visual background gradient accents */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#74ACDF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#74ACDF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-blue-800/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="bg-[#003566]/80 backdrop-blur-md border-b border-[#74ACDF]/15 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          {/* Logo brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePage('home')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#74ACDF] to-white flex items-center justify-center shadow-md">
              <span className="text-sm">🏆</span>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-white font-sans flex items-center gap-1">
                PRODE MUNDIAL
                <span className="text-[#74ACDF] font-bold font-sans">2026</span>
              </h1>
              <span className="text-[9px] font-mono text-slate-300 block tracking-wider uppercase">USA • MEX • CAN</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {[
              { id: 'home', label: 'Inicio', icon: <Home className="w-4 h-4" /> },
              { id: 'grupos', label: 'Mis Grupos', icon: <Users className="w-4 h-4" /> },
              { id: 'reglamento', label: 'Reglamento', icon: <BookOpen className="w-4 h-4" /> },
              ...(currentUser?.isAdmin
                ? [{ id: 'admin', label: 'Admin', icon: <Settings className="w-4 h-4" /> }]
                : [])
            ].map((p) => {
              const isActive = activePage === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePage(p.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#74ACDF] text-[#001D3D] font-black shadow-md shadow-[#74ACDF]/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {p.icon}
                  {p.label}
                </button>
              );
            })}

            {currentUser ? (
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                {isEditingHeaderNickname ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (tempHeaderNickname.trim()) {
                        handleUpdateNickname(tempHeaderNickname.trim());
                        setIsEditingHeaderNickname(false);
                      }
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      value={tempHeaderNickname}
                      onChange={(e) => setTempHeaderNickname(e.target.value)}
                      className="bg-slate-950 border border-sky-400 text-sky-300 text-xs px-2 py-1.5 rounded-lg focus:outline-none w-28 font-bold"
                      placeholder="Tu apodo..."
                      maxLength={30}
                      required
                      autoFocus
                    />
                    <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-1 cursor-pointer" title="Guardar">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setIsEditingHeaderNickname(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer" title="Cancelar">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <span className="text-[10px] font-mono block text-slate-400 uppercase leading-none mb-0.5">Bienvenido</span>
                      <span className="text-xs font-bold text-[#74ACDF] block">{currentUser.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setTempHeaderNickname(currentUser.name);
                        setIsEditingHeaderNickname(true);
                       }}
                      className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-sky-300 transition-all cursor-pointer"
                      title="Editar apodo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 bg-white/5 hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-450 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setActivePage('auth');
                }}
                className="flex items-center gap-1 px-3.5 py-2 bg-gradient-to-r from-[#74ACDF] to-[#9ac1e8] hover:brightness-110 text-[#001D3D] font-black text-xs uppercase rounded-xl shadow-lg transition-transform"
              >
                <UserCheck className="w-4 h-4" /> Acceder
              </button>
            )}
          </nav>

          {/* Quick mobile Hamburger menu */}
          <div className="md:hidden flex items-center gap-2">
            {currentUser && (
              <span className="text-xs font-bold text-sky-400 truncate max-w-28">{currentUser.name}</span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile slide menu container */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 text-sm py-4 px-4 space-y-3 z-50 animate-fade-in relative">
            {[
              { id: 'home', label: 'Inicio', icon: <Home className="w-4 h-4 text-sky-450" /> },
              { id: 'grupos', label: 'Mis Grupos', icon: <Users className="w-4 h-4 text-sky-450" /> },
              { id: 'reglamento', label: 'Reglamento', icon: <BookOpen className="w-4 h-4 text-sky-450" /> },
              ...(currentUser?.isAdmin
                ? [{ id: 'admin', label: 'Admin Panel Settings', icon: <Settings className="w-4 h-4 text-amber-500" /> }]
                : [])
            ].map((p) => {
              const isActive = activePage === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePage(p.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    isActive ? 'bg-sky-505/20 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p.icon}
                  {p.label}
                </button>
              );
            })}

            <div className="h-px bg-slate-800 my-2" />

            {currentUser ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase text-rose-400 bg-rose-950/20"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            ) : (
              <button
                onClick={() => {
                  setActivePage('auth');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1 py-1.5 bg-sky-500 rounded text-slate-950 font-bold"
              >
                Iniciá Sesión
              </button>
            )}
          </div>
        )}
      </header>

      {/* CORE DISPLAY PAGES */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative">
        
        {/* PAGE 1: HOME PRINCIPAL */}
        {activePage === 'home' && (
          <div className="space-y-12 relative">
            {/* BACKGROUND IMAGE OF HEROES FOR THE WHOLE LANDING */}
            <div className="absolute inset-0 -top-8 -mx-4 -z-10 pointer-events-none overflow-hidden rounded-3xl" id="heroes-landing-bg">
              <div 
                className="absolute inset-x-0 top-0 h-[650px] md:h-[800px] bg-cover bg-center bg-no-repeat opacity-[0.14] mix-blend-screen"
                style={{ 
                  backgroundImage: `url(${bgProde})`,
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0) 100%)'
                }}
              />
            </div>
            
            {/* Visual Header inspired by the elegant layout guidelines */}
            <div className="bg-[#003566]/40 border border-[#74ACDF]/20 rounded-3xl p-6 md:p-12 text-center text-white relative shadow-2xl overflow-hidden animate-fade-in flex flex-col items-center backdrop-blur-md">
              {/* artistic celeste/gold overlay */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#74ACDF] via-white to-yellow-500" />
              
              <div className="space-y-4 max-w-2xl relative z-10 flex flex-col items-center">
                <span className="px-3.5 py-1.5 bg-[#74ACDF]/20 text-[#74ACDF] border border-[#74ACDF]/30 rounded-full font-bold text-[10.5px] font-mono tracking-widest uppercase animate-pulse">
                  🏆 USA 🇺🇸 • MEX 🇲🇽 • CAN 🇨🇦 🏆
                </span>
                
                <h2 className="text-3xl md:text-6xl font-black tracking-tight text-white flex flex-col leading-none">
                  <span className="font-mono text-slate-300 text-xs tracking-widest block uppercase mb-1 font-semibold">Copa del Mundo Fifa</span>
                  PRODE MUNDIAL
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#74ACDF] to-white">2026</span>
                </h2>

                <div className="p-3 bg-[#001D3D]/65 rounded-2xl border border-white/10 max-w-md">
                  <p className="text-xs font-mono text-slate-300 leading-relaxed uppercase font-semibold">
                    11 de junio al 19 de julio de 2026 — ¡Viví la pasión!
                  </p>
                </div>

                <p className="text-sm md:text-base text-slate-200 leading-relaxed max-w-xl">
                  Armá tus predicciones, creá grupos desafiantes con amigos de fútbol, familia, compañeros de trabajo, y competí con un sistema independiente de prodes y desempates en vivo.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {currentUser ? (
                    <button
                      onClick={() => setActivePage('grupos')}
                      className="px-6 py-3 bg-[#74ACDF] hover:brightness-110 text-[#001D3D] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#74ACDF]/10 transition-transform active:scale-95 cursor-pointer"
                    >
                      Ingresar a Mis Grupos
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setActivePage('auth');
                      }}
                      className="px-6 py-3 bg-[#74ACDF] hover:brightness-110 text-[#001D3D] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#74ACDF]/10 transition-transform active:scale-95"
                    >
                      Comenzar Pronóstico
                    </button>
                  )}
                  
                  <button
                    onClick={() => setActivePage('reglamento')}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-100 font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-transform active:scale-95"
                  >
                    Leer Reglamento
                  </button>
                </div>
              </div>
            </div>

            {/* Quick overview of features / visual cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-xl">👥</span>
                  <h3 className="font-bold text-sm uppercase text-slate-200 tracking-wider">Grupos 100% Cerrados</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Creá ligas exclusivas de amigos, oficina o familia. Cada una posee un ranking y código de invitación exclusivo.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl space-y-2">
                <span className="text-xl">📈</span>
                <h3 className="font-bold text-sm uppercase text-slate-200 tracking-wider">Elegibilidad de Canales</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Podés sumar distintas predicciones independientes por cada grupo. Tus números de un grupo no se mezclan con los demás.
                </p>
              </div>

              <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl space-y-2">
                <span className="text-xl">⭐️</span>
                <h3 className="font-bold text-sm uppercase text-slate-200 tracking-wider">Pronósticos Especiales</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sumá 10 puntos prediciendo la corona definitiva, u otros 5 por el goleador de oro, jugador favorito u otra categoría clave.
                </p>
              </div>

            </div>

            {/* Simulated report viewer if simulated recently */}
            {simulationReport && (
              <div className="p-5 md:p-6 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-sky-400/25 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-400 w-5 h-5 animate-pulse" />
                    <h4 className="font-extrabold text-white text-sm md:text-base">Métricas del Simulación de Pruebas de QA</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{simulationReport.timestamp}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900">
                    <span className="text-2xl font-black text-sky-400 font-mono block">{simulationReport.userCount}</span>
                    <span className="text-[9.5px] font-mono uppercase text-slate-500">Usuarios Activos</span>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900">
                    <span className="text-2xl font-black text-sky-400 font-mono block">{simulationReport.groupCount}</span>
                    <span className="text-[9.5px] font-mono uppercase text-slate-500">Grupos Creados</span>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900">
                    <span className="text-2xl font-black text-sky-400 font-mono block">{simulationReport.matchesPlayed}</span>
                    <span className="text-[9.5px] font-mono uppercase text-slate-500">Partidos Oficiales</span>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900">
                    <span className="text-2xl font-black text-sky-400 font-mono block">{simulationReport.predictionsCount}</span>
                    <span className="text-[9.5px] font-mono uppercase text-slate-500">Total Predicciones</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl space-y-1.5 border border-slate-800">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Estado de Funcionamiento de QA</span>
                  <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                    {simulationReport.statusMessage}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block font-bold">Top 3 Jugadores Simulados en Copa</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {simulationReport.topPlayers.slice(0, 3).map((tp, tpIdx) => (
                      <div key={tp.name + tpIdx} className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-200">
                          {tpIdx === 0 ? '👑' : tpIdx === 1 ? '🌟' : '🔥'} {tp.name}
                        </span>
                        <span className="font-mono text-sky-400 font-bold">{tp.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleResetData}
                    className="text-xs text-rose-450 hover:text-rose-400 underline font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Limpiar datos simulados para registrar mi propia cuenta
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAGE 2: MY GROUPS DASHBOARD */}
        {activePage === 'grupos' && (
          <div>
            {!currentUser ? (
              <div className="text-center py-16 bg-slate-900/20 rounded-2xl border border-slate-800 space-y-4 max-w-md mx-auto">
                <Compass className="w-10 h-10 text-sky-400 mx-auto animate-spin-slow" />
                <h3 className="font-bold text-white text-base">Iniciá sesión para ver tus grupos</h3>
                <p className="text-slate-400 text-xs">
                  Para guardar tus pronósticos independientes tenés que crear una cuenta de forma rápida o iniciar sesión con una cuenta simulada.
                </p>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setActivePage('auth');
                  }}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg text-slate-950 font-bold text-xs uppercase"
                >
                  Acceder / Registrarme
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Active Group Details Explorer takes precedence if selected */}
                {activeGroupId ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setActiveGroupId(null)}
                        className="text-xs text-sky-400 hover:text-sky-300 font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        ← Volver a Mis Grupos
                      </button>
                      
                      <span className="text-[10px] font-mono uppercase bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-slate-450">
                        Código de este grupo: {getActiveGroupObj()?.inviteCode}
                      </span>
                    </div>

                    {getActiveGroupObj() ? (
                      <GroupDetails
                        group={getActiveGroupObj()!}
                        currentUser={currentUser}
                        usersMap={users}
                        matches={matches}
                        predictionsStore={predictions}
                        isGroupStageLocked={locks.isGroupStageLocked}
                        isKnockoutStageLocked={locks.isKnockoutStageLocked}
                        isKnockoutPhaseVisible={locks.isKnockoutPhaseVisible ?? false}
                        onUpdatePrediction={handleUpdatePrediction}
                        onUpdateExtrasPrediction={handleUpdateExtrasPrediction}
                        actualExtras={actualExtras}
                        globalGroups={groups}
                        onAcceptPendingMember={handleAcceptPendingUser}
                        onRejectPendingMember={handleRejectPendingUser}
                        onRemoveMemberFromGroup={handleRemoveUserFromGroup}
                        onUpdateActualResult={handleUpdateMatchActualResult}
                        onUpdateGroupName={handleUpdateGroupName}
                      />
                    ) : (
                      <p className="text-xs text-rose-450 text-center">No se pudo cargar la información del grupo seleccionado.</p>
                    )}
                  </div>
                ) : (
                  <MyGroups
                    groups={groups}
                    currentUser={currentUser}
                    usersMap={users}
                    onCreateGroup={handleCreateGroup}
                    onJoinGroup={handleJoinByCode}
                    onExitGroup={handleExitGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onSelectGroup={setActiveGroupId}
                    activeGroupId={activeGroupId}
                    isGroupCreationLocked={locks.isGroupCreationLocked}
                    onUpdateNickname={handleUpdateNickname}
                    predictionsStore={predictions}
                    matches={matches}
                    actualExtras={actualExtras}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* PAGE 3: CHRONOLOGY / REGULATION */}
        {activePage === 'reglamento' && (
          <div className="animate-fade-in py-2">
            <Regulation />
          </div>
        )}

        {/* PAGE 4: ADMIN CONTROLS PANEL */}
        {activePage === 'admin' && (
          <div>
            {currentUser?.isAdmin ? (
              <AdminPanel
                matches={matches}
                users={users}
                isGroupStageLocked={locks.isGroupStageLocked}
                isKnockoutStageLocked={locks.isKnockoutStageLocked}
                isGroupCreationLocked={locks.isGroupCreationLocked}
                isKnockoutPhaseVisible={locks.isKnockoutPhaseVisible ?? false}
                onUpdateMatchActualResult={handleUpdateMatchActualResult}
                onUpdateMatchDateTime={handleUpdateMatchDateTime}
                onUpdateTeamName={handleUpdateTeamName}
                onGenerateEliminatories={handleGenerateBracketElements}
                onToggleLock={handleToggleLock}
                onDeleteUser={handleDeleteUser}
                onTriggerSimulation={handleTriggerSimulation}
                onResetData={handleResetData}
                actualExtras={actualExtras}
                onUpdateActualExtras={handleUpdateActualExtras}
              />
            ) : (
              <div className="text-center py-12 max-w-sm mx-auto bg-slate-900/40 rounded-xl space-y-4">
                <X className="text-rose-500 w-10 h-10 mx-auto" />
                <h4 className="font-bold text-white text-sm uppercase">Acceso No Autorizado</h4>
                <p className="text-xs text-slate-400">Sólo las cuentas con bandera de administrador pueden acceder a este panel de control.</p>
                <button onClick={() => setActivePage('home')} className="px-3.5 py-1.5 bg-slate-800 text-xs rounded font-bold">Volver al Inicio</button>
              </div>
            )}
          </div>
        )}

        {/* PAGE 5: AUTH LOGIN / REGISTER / FORGOT FLOW */}
        {activePage === 'auth' && (
          <div className="relative py-8 md:py-16">
            {/* BACKGROUND IMAGE OF HEROES FOR THE AUTH PAGE */}
            <div className="absolute inset-0 -top-12 -mx-4 -z-10 pointer-events-none overflow-hidden rounded-3xl" id="heroes-auth-bg">
              <div 
                className="absolute inset-x-0 top-0 h-[600px] md:h-[750px] bg-cover bg-center bg-no-repeat opacity-[0.16] mix-blend-screen"
                style={{ 
                  backgroundImage: `url(${bgProde})`,
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0) 100%)'
                }}
              />
            </div>

            <div className="max-w-md mx-auto bg-slate-900/60 backdrop-blur-md rounded-2xl border border-sky-500/15 p-6 md:p-8 space-y-6 shadow-2xl animate-fade-in">
            {/* Auth headers */}
            <div className="text-center space-y-1.5">
              <span className="text-2xl">🏆</span>
              <h3 className="text-xl font-extrabold text-white font-sans tracking-tight">
                {authMode === 'login' && 'Ingresar a mi Cuenta'}
                {authMode === 'register' && 'Crear nueva cuenta Prode'}
                {authMode === 'forgot' && 'Recuperar mi contraseña'}
                {authMode === 'verify' && 'Confirmar mi Cuenta'}
              </h3>
              <p className="text-slate-400 text-xs">
                {authMode === 'login' && 'Accedé para guardar tus predicciones independientes'}
                {authMode === 'register' && 'Registrate con tu correo para competir gratis'}
                {authMode === 'forgot' && 'Te enviaremos las instrucciones de restablecimiento'}
                {authMode === 'verify' && 'Ingresá el código enviado a tu casilla'}
              </p>
            </div>

            {authError && (
              <div className="bg-rose-500/20 text-rose-300 border border-rose-500/30 p-3 rounded-lg text-xs font-semibold text-center font-mono">
                ⚠ {authError}
              </div>
            )}

            {/* Forms body */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 text-xs md:text-sm">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:outline-none focus:border-sky-505 font-mono placeholder:text-slate-500/40 placeholder:font-sans placeholder:italic"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Contraseña</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] text-sky-400 hover:underline font-semibold"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Contraseña segura"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:outline-none placeholder:text-slate-500/40 placeholder:italic"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-500/5 mt-2"
                >
                  Ingresar
                </button>

                <div className="relative my-3.5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800/60 font-sans"></div>
                  </div>
                  <span className="relative bg-slate-900 px-3 text-[10px] uppercase text-slate-500 tracking-widest font-mono">O ingresar con</span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-xl transition-all text-xs text-white font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                     <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.414 0-6.196-2.783-6.196-6.196s2.782-6.196 6.196-6.196c1.558 0 2.978.577 4.072 1.53l3.056-3.056C19.261 2.212 15.938 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.898 0 11.115-4.242 11.115-11.24 0-.769-.071-1.513-.198-2.24H12.24z" />
                  </svg>
                  Iniciar sesión con Google
                </button>

                <p className="text-center text-xs text-slate-400 mt-2 font-sans">
                  ¿No tenés cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError('');
                    }}
                    className="text-sky-400 hover:underline font-bold"
                  >
                    Registrate gratis
                  </button>
                </p>
              </form>
            )}

            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 text-xs md:text-sm">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Nombre o Apodo de Jugador</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Ej. LeoMessi10"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:outline-none focus:border-sky-505 placeholder:text-slate-500/40 placeholder:italic"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:outline-none focus:border-sky-505 font-mono placeholder:text-slate-500/40 placeholder:font-sans placeholder:italic"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:outline-none placeholder:text-slate-500/40 placeholder:italic"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Confirmar Contraseña</label>
                  <input
                    type="password"
                    required
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                    placeholder="Repetir contraseña"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:outline-none placeholder:text-slate-500/40 placeholder:italic"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-500/5 mt-2"
                >
                  Confirmar Registro
                </button>

                <p className="text-center text-xs text-slate-400 mt-2 font-sans">
                  ¿Ya tenés cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                    }}
                    className="text-sky-400 hover:underline font-bold"
                  >
                    Iniciá Sesión
                  </button>
                </p>
              </form>
            )}

            {authMode === 'verify' && (
              <form onSubmit={handleVerifyCodeSubmit} className="space-y-3.5 text-xs md:text-sm text-center">
                <div className="bg-sky-500/10 border border-sky-500/20 text-slate-200 p-4 rounded-xl text-left space-y-2.5 leading-relaxed">
                  <p className="text-xs">
                    Te enviamos un código de confirmación de 6 dígitos al correo: <br />
                    <strong className="text-sky-400 font-mono text-[13px] block mt-1 break-all select-all">{verifyingEmail}</strong>
                  </p>
                  <p className="text-slate-400 text-[10.5px]">
                    Por favor, revisá tu bandeja de entrada o la carpeta de <strong>Correo no deseado / Spam</strong> e ingresá el código de confirmación para activar tu acceso.
                  </p>
                </div>

                <div className="space-y-1.5 mt-2.5 text-center">
                  <label className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block">Código de Confirmación</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationInputCode}
                    onChange={(e) => setVerificationInputCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej. 123456"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-3 text-center focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono text-lg tracking-widest"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-500/10 cursor-pointer"
                >
                  Verificar Cuenta
                </button>

                <div className="flex justify-between items-center text-xs pt-1.5 px-0.5">
                  <button
                    type="button"
                    onClick={handleBackToLoginFromVerify}
                    className="text-slate-450 hover:text-white hover:underline transition-all cursor-pointer font-medium"
                  >
                    ← Volver a Ingresar
                  </button>

                  <button
                    type="button"
                    onClick={handleResendVerifyCode}
                    className="text-sky-400 hover:text-sky-350 hover:underline font-black transition-all cursor-pointer"
                  >
                    Reenviar correo
                  </button>
                </div>
              </form>
            )}

            {authMode === 'forgot' && (
              <form onSubmit={handleForgotFlow} className="space-y-4 text-xs md:text-sm">
                <p className="text-slate-300 text-xs leading-relaxed font-sans">
                  Ingresá el correo electrónico que utilizaste durante tu registro para recuperar las credenciales y recibir el enlace de restablecimiento de contraseña de acceso al prode.
                </p>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:outline-none font-mono placeholder:text-slate-500/40 placeholder:font-sans placeholder:italic"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Restablecer Contraseña
                </button>

                <p className="text-center text-xs text-slate-400 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                    }}
                    className="text-sky-400 hover:underline font-semibold"
                  >
                    ← Volver a inicio de sesión
                  </button>
                </p>
              </form>
            )}
          </div>
          </div>
        )}

      </main>

      {/* SIMULATED EMAIL SANDBOX FOR LOCAL PROTOTYPING */}
      {lastSentCode && !isSmtpConfigured && (
        <div className="fixed bottom-36 right-4 z-40 bg-slate-950 border-2 border-yellow-500/50 rounded-xl p-4 shadow-2xl backdrop-blur-md max-w-[305px] text-white space-y-3">
          <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
            <h5 className="text-[11px] font-bold font-mono text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>📧</span> Servidor de Correo Prode
            </h5>
            <button
              onClick={() => setLastSentCode('')}
              className="text-[10px] text-slate-400 hover:text-white hover:underline cursor-pointer font-bold font-mono"
            >
              Cerrar
            </button>
          </div>
          <p className="text-[10px] text-slate-300 leading-normal">
            Se envió un correo desde <span className="font-bold text-yellow-400">prodeonline.rs@gmail.com</span> a <span className="font-bold text-sky-300">{verifyingEmail}</span> con tu código de confirmación de cuenta:
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 flex justify-between items-center gap-2">
            <span className="font-mono text-xs text-yellow-400 font-black tracking-widest">{lastSentCode}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(lastSentCode);
                alert('¡Código copiado al portapapeles!');
                setVerificationInputCode(lastSentCode);
              }}
              className="px-2 py-0.5 bg-yellow-400/25 border border-yellow-400 text-yellow-300 rounded font-mono text-[9px] hover:bg-yellow-400/35 transition-all text-center"
            >
              Copiar y Pegar
            </button>
          </div>
          <p className="text-[8.5px] text-slate-400 leading-normal">
            * <strong>Listo para Producción:</strong> Para enviar correos reales por SMTP o servicios como SendGrid/Resend, podés configurar un backend Node conectándolo con este flujo.
          </p>
        </div>
      )}

      {/* QUICK FLOATING TRIGGER FOR WORKSPACE SIMULATOR TEST */}
      {currentUser?.isAdmin && (
        <div className="fixed bottom-18 md:bottom-4 right-4 z-35 bg-slate-900 border border-sky-400/30 rounded-xl p-3 flex items-center gap-1.5 shadow-2xl backdrop-blur-md max-w-[280px]">
          <div className="text-left">
            <p className="text-[10px] font-mono text-slate-450 uppercase font-black tracking-wide">Test & QA Automático (Vela)</p>
            <span className="text-[9px] font-mono text-sky-400 leading-none">Genera 50 usuarios con 6 grupos</span>
          </div>
          <button
            onClick={handleTriggerSimulation}
            className="p-2 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg hover:from-sky-400 text-white active:scale-90 transition-all cursor-pointer"
            title="Ejecutar simulación de 50 usuarios"
          >
            <Play className="w-4 h-4 text-slate-950 font-black animate-pulse" />
          </button>
        </div>
      )}

      {/* TAB BAR NAVIGATION FOOTER FOR MOBILE DEVICES */}
      {/* Optimized safe sizes according to section "Responsive y Mobile — Tab Bars" */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 h-16 flex items-center justify-around z-40 backdrop-blur-md">
        {[
          { id: 'home', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
          { id: 'grupos', label: 'Grupos', icon: <Users className="w-5 h-5" /> },
          { id: 'reglamento', label: 'Reglamento', icon: <BookOpen className="w-5 h-5" /> },
          ...(currentUser?.isAdmin ? [{ id: 'admin', label: 'Admin', icon: <Settings className="w-5 h-5" /> }] : [])
        ].map((tab) => {
          const isActive = activePage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActivePage(tab.id as any);
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full font-sans transition-colors cursor-pointer min-h-[44px] min-w-[44px] ${
                isActive ? 'text-sky-400 font-extrabold' : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              {tab.icon}
              <span className={`text-[10px] font-sans tracking-wide mt-1 scale-95 ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
