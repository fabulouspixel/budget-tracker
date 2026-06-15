export interface StoragePersistenceStatus {
  supported: boolean;
  persisted: boolean;
}

export async function getStoragePersistenceStatus(): Promise<StoragePersistenceStatus> {
  if (!("storage" in navigator) || !navigator.storage.persisted) {
    return {
      supported: false,
      persisted: false,
    };
  }

  return {
    supported: true,
    persisted: await navigator.storage.persisted(),
  };
}

export async function requestPersistentStorage(): Promise<StoragePersistenceStatus> {
  if (!("storage" in navigator) || !navigator.storage.persist) {
    return {
      supported: false,
      persisted: false,
    };
  }

  const persisted = await navigator.storage.persist();

  return {
    supported: true,
    persisted,
  };
}
