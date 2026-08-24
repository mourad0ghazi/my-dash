import { createHash, createPublicKey, createVerify } from 'node:crypto'
import { execFile as execFileCallback } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import JSZip from 'jszip'

const execFile = promisify(execFileCallback)
const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const V2_ID = 0x7109871a
const V3_ID = 0xf05368c0
const APK_MAGIC = Buffer.from('APK Sig Block 42', 'ascii')
const ONE_MEBIBYTE = 1024 * 1024

function invariant(condition, message) {
  if (!condition) throw new Error(`Vérification APK : ${message}`)
}

function findEocd(data) {
  for (let offset = data.length - 22; offset >= Math.max(0, data.length - 22 - 0xffff); offset -= 1) {
    if (data.readUInt32LE(offset) === 0x06054b50) {
      return {
        offset,
        entries: data.readUInt16LE(offset + 10),
        centralDirectorySize: data.readUInt32LE(offset + 12),
        centralDirectoryOffset: data.readUInt32LE(offset + 16),
      }
    }
  }
  throw new Error('Vérification APK : fin du répertoire ZIP introuvable.')
}

function readLengthPrefixed(data, offset) {
  invariant(offset + 4 <= data.length, 'champ de longueur tronqué.')
  const length = data.readUInt32LE(offset)
  const start = offset + 4
  const end = start + length
  invariant(end <= data.length, 'champ de données tronqué.')
  return { data: data.subarray(start, end), next: end }
}

function parseSigningBlock(data, centralDirectoryOffset) {
  invariant(data.subarray(centralDirectoryOffset - 16, centralDirectoryOffset).equals(APK_MAGIC), 'bloc de signature APK absent.')
  const size = Number(data.readBigUInt64LE(centralDirectoryOffset - 24))
  const start = centralDirectoryOffset - size - 8
  invariant(start >= 0, 'taille de bloc de signature invalide.')
  invariant(Number(data.readBigUInt64LE(start)) === size, 'les deux tailles du bloc de signature diffèrent.')
  const pairs = new Map()
  let offset = start + 8
  const end = centralDirectoryOffset - 24
  while (offset < end) {
    invariant(offset + 12 <= end, 'paire de signature tronquée.')
    const pairSize = Number(data.readBigUInt64LE(offset))
    invariant(pairSize >= 4 && offset + 8 + pairSize <= end, 'taille de paire de signature invalide.')
    const id = data.readUInt32LE(offset + 8)
    pairs.set(id, data.subarray(offset + 12, offset + 8 + pairSize))
    offset += 8 + pairSize
  }
  invariant(offset === end, 'fin inattendue du bloc de signature.')
  return { start, size: size + 8, pairs }
}

function parseSchemeSigner(value, scheme) {
  const signers = readLengthPrefixed(value, 0)
  invariant(signers.next === value.length, `conteneur ${scheme} mal dimensionné.`)
  const signer = readLengthPrefixed(signers.data, 0)
  invariant(signer.next === signers.data.length, `${scheme} doit contenir exactement un signataire.`)
  let offset = 0
  const signedDataField = readLengthPrefixed(signer.data, offset)
  offset = signedDataField.next

  let minSdk
  let maxSdk
  if (scheme === 'v3') {
    invariant(offset + 8 <= signer.data.length, 'plage SDK v3 tronquée.')
    minSdk = signer.data.readUInt32LE(offset)
    maxSdk = signer.data.readUInt32LE(offset + 4)
    offset += 8
  }

  const signatures = readLengthPrefixed(signer.data, offset)
  offset = signatures.next
  const publicKey = readLengthPrefixed(signer.data, offset)
  offset = publicKey.next
  invariant(offset === signer.data.length, `données de signataire ${scheme} excédentaires.`)

  const signatureRecord = readLengthPrefixed(signatures.data, 0)
  invariant(signatureRecord.next === signatures.data.length, `liste de signatures ${scheme} invalide.`)
  const algorithmId = signatureRecord.data.readUInt32LE(0)
  const signature = readLengthPrefixed(signatureRecord.data, 4)
  invariant(signature.next === signatureRecord.data.length, `signature ${scheme} mal dimensionnée.`)

  offset = 0
  const digestRecords = readLengthPrefixed(signedDataField.data, offset)
  offset = digestRecords.next
  const certificates = readLengthPrefixed(signedDataField.data, offset)
  offset = certificates.next
  if (scheme === 'v3') {
    invariant(offset + 8 <= signedDataField.data.length, 'plage SDK signée v3 tronquée.')
    invariant(signedDataField.data.readUInt32LE(offset) === minSdk && signedDataField.data.readUInt32LE(offset + 4) === maxSdk, 'plages SDK v3 incohérentes.')
    offset += 8
  }
  const attributes = readLengthPrefixed(signedDataField.data, offset)
  offset = attributes.next
  invariant(offset === signedDataField.data.length, `données signées ${scheme} excédentaires.`)
  invariant(attributes.data.length === 0, `attributs ${scheme} inattendus.`)

  const digestRecord = readLengthPrefixed(digestRecords.data, 0)
  invariant(digestRecord.next === digestRecords.data.length, `liste de condensats ${scheme} invalide.`)
  invariant(digestRecord.data.readUInt32LE(0) === algorithmId, `algorithmes de signature et de condensat ${scheme} différents.`)
  const digest = readLengthPrefixed(digestRecord.data, 4)
  invariant(digest.next === digestRecord.data.length, `condensat ${scheme} mal dimensionné.`)

  const certificate = readLengthPrefixed(certificates.data, 0)
  invariant(certificate.next === certificates.data.length, `chaîne de certificats ${scheme} invalide.`)

  return {
    signedData: signedDataField.data,
    algorithmId,
    signature: signature.data,
    digest: digest.data,
    certificate: certificate.data,
    publicKey: publicKey.data,
    minSdk,
    maxSdk,
  }
}

function algorithmDetails(algorithmId) {
  if (algorithmId === 0x0103) return { hash: 'sha256', verify: 'RSA-SHA256', digestLength: 32 }
  if (algorithmId === 0x0104) return { hash: 'sha512', verify: 'RSA-SHA512', digestLength: 64 }
  throw new Error(`Vérification APK : algorithme de signature non pris en charge 0x${algorithmId.toString(16)}.`)
}

function computeApkContentDigest(data, signingBlockStart, eocd) {
  const sections = [
    data.subarray(0, signingBlockStart),
    data.subarray(eocd.centralDirectoryOffset, eocd.offset),
    Buffer.from(data.subarray(eocd.offset)),
  ]
  sections[2].writeUInt32LE(signingBlockStart, 16)
  return hash => {
    const chunkHashes = []
    for (const section of sections) {
      for (let offset = 0; offset < section.length; offset += ONE_MEBIBYTE) {
        const chunk = section.subarray(offset, Math.min(section.length, offset + ONE_MEBIBYTE))
        const prefix = Buffer.alloc(5)
        prefix[0] = 0xa5
        prefix.writeUInt32LE(chunk.length, 1)
        chunkHashes.push(createHash(hash).update(prefix).update(chunk).digest())
      }
    }
    const top = Buffer.alloc(5)
    top[0] = 0x5a
    top.writeUInt32LE(chunkHashes.length, 1)
    return createHash(hash).update(top).update(Buffer.concat(chunkHashes)).digest()
  }
}

function pemToDer(pem) {
  return Buffer.from(pem.replace(/-----(BEGIN|END) CERTIFICATE-----|\s/g, ''), 'base64')
}

function verifyScheme(signer, scheme, expectedCertificateDer, expectedPublicKeyDer, digestFor) {
  const algorithm = algorithmDetails(signer.algorithmId)
  invariant(signer.digest.length === algorithm.digestLength, `taille du condensat ${scheme} invalide.`)
  invariant(Buffer.from(signer.digest).equals(digestFor(algorithm.hash)), `condensat de contenu ${scheme} invalide.`)
  invariant(Buffer.from(signer.certificate).equals(expectedCertificateDer), `certificat ${scheme} inattendu.`)
  invariant(Buffer.from(signer.publicKey).equals(expectedPublicKeyDer), `clé publique SPKI ${scheme} invalide.`)
  const verifier = createVerify(algorithm.verify)
  verifier.update(signer.signedData)
  verifier.end()
  invariant(verifier.verify({ key: expectedPublicKeyDer, format: 'der', type: 'spki' }, signer.signature), `signature cryptographique ${scheme} invalide.`)
}

function splitManifestSections(data) {
  const sections = []
  const separator = Buffer.from('\r\n\r\n', 'ascii')
  let start = 0
  while (start < data.length) {
    const boundary = data.indexOf(separator, start)
    invariant(boundary >= 0, 'section de manifeste JAR sans séparateur.')
    const end = boundary + separator.length
    sections.push(data.subarray(start, end))
    start = end
  }
  return sections
}

function sectionFields(section) {
  const fields = new Map()
  const lines = section.toString('utf8').split('\r\n')
  let previousKey
  for (const line of lines) {
    if (!line) continue
    if (line.startsWith(' ') && previousKey) {
      fields.set(previousKey, `${fields.get(previousKey)}${line.slice(1)}`)
      continue
    }
    const separator = line.indexOf(': ')
    invariant(separator > 0, `ligne de manifeste JAR invalide : ${line}`)
    previousKey = line.slice(0, separator)
    fields.set(previousKey, line.slice(separator + 2))
  }
  return fields
}

async function verifyV1(zip, expectedCertificatePem) {
  const manifestFile = zip.file('META-INF/MANIFEST.MF')
  const sfFile = zip.file('META-INF/CERT.SF')
  const rsaFile = zip.file('META-INF/CERT.RSA')
  invariant(manifestFile && sfFile && rsaFile, 'fichiers de signature JAR v1 incomplets.')
  const [manifest, sf, rsa] = await Promise.all([
    manifestFile.async('nodebuffer'),
    sfFile.async('nodebuffer'),
    rsaFile.async('nodebuffer'),
  ])

  const manifestSections = splitManifestSections(manifest)
  const manifestEntries = new Map()
  for (const section of manifestSections.slice(1)) {
    const fields = sectionFields(section)
    const name = fields.get('Name')
    invariant(name, 'entrée de manifeste JAR sans nom.')
    invariant(!manifestEntries.has(name), `entrée de manifeste JAR dupliquée : ${name}`)
    manifestEntries.set(name, { fields, section })
  }

  const signableEntries = Object.values(zip.files).filter(entry => !entry.dir && !entry.name.startsWith('META-INF/'))
  invariant(manifestEntries.size === signableEntries.length, 'le manifeste JAR ne couvre pas tous les fichiers APK.')
  for (const entry of signableEntries) {
    const signedEntry = manifestEntries.get(entry.name)
    invariant(signedEntry, `fichier absent du manifeste JAR : ${entry.name}`)
    const content = await entry.async('nodebuffer')
    const actual = createHash('sha256').update(content).digest('base64')
    invariant(signedEntry.fields.get('SHA-256-Digest') === actual, `condensat JAR invalide : ${entry.name}`)
  }

  const sfSections = splitManifestSections(sf)
  const sfMain = sectionFields(sfSections[0])
  invariant(sfMain.get('SHA-256-Digest-Manifest') === createHash('sha256').update(manifest).digest('base64'), 'condensat global du manifeste JAR invalide.')
  invariant(sfMain.get('X-Android-APK-Signed') === '2, 3', 'déclaration des schémas APK dans CERT.SF invalide.')
  const sfEntries = new Map(sfSections.slice(1).map(section => [sectionFields(section).get('Name'), sectionFields(section)]))
  invariant(sfEntries.size === manifestEntries.size, 'CERT.SF ne couvre pas toutes les sections du manifeste.')
  for (const [name, entry] of manifestEntries) {
    const expected = createHash('sha256').update(entry.section).digest('base64')
    invariant(sfEntries.get(name)?.get('SHA-256-Digest') === expected, `condensat de section CERT.SF invalide : ${name}`)
  }

  const temporary = await mkdtemp(join(tmpdir(), 'lifeos-v1-'))
  try {
    const sfPath = join(temporary, 'CERT.SF')
    const rsaPath = join(temporary, 'CERT.RSA')
    const certificatePath = join(temporary, 'certificate.pem')
    await Promise.all([
      writeFile(sfPath, sf),
      writeFile(rsaPath, rsa),
      writeFile(certificatePath, expectedCertificatePem),
    ])
    await execFile('openssl', [
      'cms', '-verify', '-binary', '-inform', 'DER',
      '-in', rsaPath, '-content', sfPath,
      '-certfile', certificatePath, '-noverify',
      '-out', '/dev/null',
    ], { maxBuffer: 4 * 1024 * 1024 })
  } catch (error) {
    throw new Error(`Vérification APK : signature PKCS#7 v1 invalide (${error instanceof Error ? error.message : String(error)}).`)
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}

function parseCentralDirectory(data, eocd) {
  const entries = new Map()
  let offset = eocd.centralDirectoryOffset
  for (let index = 0; index < eocd.entries; index += 1) {
    invariant(data.readUInt32LE(offset) === 0x02014b50, 'entrée du répertoire ZIP invalide.')
    const compressionMethod = data.readUInt16LE(offset + 10)
    const nameLength = data.readUInt16LE(offset + 28)
    const extraLength = data.readUInt16LE(offset + 30)
    const commentLength = data.readUInt16LE(offset + 32)
    const localHeaderOffset = data.readUInt32LE(offset + 42)
    const name = data.subarray(offset + 46, offset + 46 + nameLength).toString('utf8')
    invariant(data.readUInt32LE(localHeaderOffset) === 0x04034b50, `en-tête ZIP local invalide : ${name}`)
    const localNameLength = data.readUInt16LE(localHeaderOffset + 26)
    const localExtraLength = data.readUInt16LE(localHeaderOffset + 28)
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength
    entries.set(name, { compressionMethod, dataOffset })
    offset += 46 + nameLength + extraLength + commentLength
  }
  invariant(offset === eocd.centralDirectoryOffset + eocd.centralDirectorySize, 'taille du répertoire ZIP incohérente.')
  return entries
}

export async function verifyAndroidApk(apkPath, options = {}) {
  const data = await readFile(apkPath)
  const eocd = findEocd(data)
  const signingBlock = parseSigningBlock(data, eocd.centralDirectoryOffset)
  const v2Value = signingBlock.pairs.get(V2_ID)
  const v3Value = signingBlock.pairs.get(V3_ID)
  invariant(v2Value, 'signature APK v2 absente.')
  invariant(v3Value, 'signature APK v3 absente.')

  const expectedCertificatePath = options.expectedCertificate || join(root, 'android', 'release-certificate.pem')
  const expectedCertificatePem = await readFile(expectedCertificatePath, 'utf8')
  const expectedCertificateDer = pemToDer(expectedCertificatePem)
  const expectedPublicKeyDer = createPublicKey(expectedCertificatePem).export({ type: 'spki', format: 'der' })
  const digestFor = computeApkContentDigest(data, signingBlock.start, eocd)
  const v2 = parseSchemeSigner(v2Value, 'v2')
  const v3 = parseSchemeSigner(v3Value, 'v3')
  verifyScheme(v2, 'v2', expectedCertificateDer, expectedPublicKeyDer, digestFor)
  verifyScheme(v3, 'v3', expectedCertificateDer, expectedPublicKeyDer, digestFor)
  invariant(v3.minSdk === 24 && v3.maxSdk === 0x7fffffff, 'plage SDK de la signature v3 inattendue.')

  const zip = await JSZip.loadAsync(data)
  for (const required of ['AndroidManifest.xml', 'classes.dex', 'resources.arsc', 'assets/www/index.html', 'assets/licenses/NITRON-LICENSE.txt']) {
    invariant(zip.file(required), `fichier Android requis absent : ${required}`)
  }
  await verifyV1(zip, expectedCertificatePem)

  const entries = parseCentralDirectory(data, eocd)
  const resources = entries.get('resources.arsc')
  invariant(resources?.compressionMethod === 0, 'resources.arsc doit être stocké sans compression.')
  invariant(resources.dataOffset % 4 === 0, 'resources.arsc doit être aligné sur 4 octets.')

  const aapt = options.aapt || require('aaptjs3').getBinPath()
  const { stdout: badging } = await execFile(aapt, ['dump', 'badging', apkPath], { maxBuffer: 8 * 1024 * 1024 })
  const expectedPackage = options.expectedPackage || 'ma.lifeos.app'
  invariant(badging.includes(`package: name='${expectedPackage}'`), `package Android différent de ${expectedPackage}.`)
  invariant(badging.includes("launchable-activity: name='com.nicron.webview.MainActivity'"), 'activité de lancement LifeOS absente.')
  invariant(badging.includes("minSdkVersion:'21'"), 'minSdkVersion doit être 21.')
  invariant(badging.includes("targetSdkVersion:'34'"), 'targetSdkVersion doit être 34.')

  return {
    path: apkPath,
    sizeBytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
    certificateSha256: createHash('sha256').update(expectedCertificateDer).digest('hex'),
    signatureSchemes: ['v1 (JAR)', 'v2', 'v3'],
    signingBlockBytes: signingBlock.size,
    badging,
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const apkPath = resolve(process.argv[2] || join(root, 'public', 'downloads', 'LifeOS-Android-v2.1.0.apk'))
  verifyAndroidApk(apkPath).then(result => {
    console.log(`APK valide : ${result.path}`)
    console.log(`Taille : ${result.sizeBytes} octets`)
    console.log(`SHA-256 : ${result.sha256}`)
    console.log(`Certificat : ${result.certificateSha256}`)
    console.log(`Signatures : ${result.signatureSchemes.join(', ')}`)
  }).catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
