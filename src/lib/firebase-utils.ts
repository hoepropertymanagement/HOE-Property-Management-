import { supabase } from './supabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

export async function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let userId: string | undefined;
  let email: string | undefined;

  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      userId = data.session.user.id;
      email = data.session.user.email;
    }
  } catch (e) {
    // Ignore error while fetching sessions
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId,
      email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Just log the error to prevent application crashes on startup or permissions fetching
}
