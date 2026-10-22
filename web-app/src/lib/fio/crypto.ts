const encoder = new TextEncoder()
const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const fromBase64 = (text: string) =>
  Uint8Array.from(atob(text), (char) => char.charCodeAt(0))

async function encryptionKey(secret: string) {
  if (!secret || !/^[a-fA-F0-9]{64}$/.test(secret))
    throw new Error('Fio encryption is not configured')
  const bytes = Uint8Array.from(secret.match(/.{2}/g)!, (pair) =>
    parseInt(pair, 16)
  )
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, [
    'encrypt',
    'decrypt'
  ])
}

export async function encryptFioToken(
  token: string,
  secret: string,
  userId: string
): Promise<string> {
  const key = await encryptionKey(secret)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(userId) },
    key,
    encoder.encode(token)
  )
  return `v1:${toBase64(iv)}:${toBase64(new Uint8Array(encrypted))}`
}

export async function decryptFioToken(
  value: string,
  secret: string,
  userId: string
): Promise<string> {
  const [version, iv, ciphertext] = value.split(':')
  if (version !== 'v1' || !iv || !ciphertext)
    throw new Error('Invalid encrypted Fio token')
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: fromBase64(iv),
      additionalData: encoder.encode(userId)
    },
    await encryptionKey(secret),
    fromBase64(ciphertext)
  )
  return new TextDecoder().decode(decrypted)
}

export async function fingerprintFioToken(token: string): Promise<string> {
  return toBase64(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(token)))
  )
}
