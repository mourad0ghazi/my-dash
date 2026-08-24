import { createHash } from 'node:crypto'
import { execFile as execFileCallback } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import JSZip from 'jszip'
import { signApk } from 'apk_sign_ts'
import { verifyAndroidApk } from './verify-android-apk.mjs'

const execFile = promisify(execFileCallback)
const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const androidDir = join(root, 'android')
const distDir = join(root, 'dist')
const publicDownloads = join(root, 'public', 'downloads')
const distDownloads = join(distDir, 'downloads')
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

const packageName = 'ma.lifeos.app'
const versionName = packageJson.version
const [versionMajor = 0, versionMinor = 0, versionPatch = 0] = versionName.split('.').map(Number)
const versionCode = versionMajor * 10000 + versionMinor * 100 + versionPatch
const apkFilename = `LifeOS-Android-v${versionName}.apk`
const metadataFilename = 'lifeos-android.json'
const outputApk = join(publicDownloads, apkFilename)
const releaseCertificate = join(androidDir, 'release-certificate.pem')
const TRUSTED_TOOL_HASHES = {
  aapt: 'e4dff6060827a3e401bce376e47916f2f93a89602af54973ffd3fdfc2528be3f',
  framework: 'fee7f101ff4d7fbaee9f715869248f1eb91e9fffe5f7eaf44fcf55192c5a3991',
  runtime: '584d55e04487b30898dd63b0ff70ec076ea2ebeddd33974fa4c9b18d15fb652b',
}

function log(message) {
  console.log(`[android] ${message}`)
}

async function run(command, args, options = {}) {
  const result = await execFile(command, args, { cwd: root, maxBuffer: 16 * 1024 * 1024, ...options })
  if (result.stdout?.trim()) console.log(result.stdout.trim())
  if (result.stderr?.trim()) console.error(result.stderr.trim())
  return result
}

async function listFiles(directory) {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await listFiles(fullPath))
    else if (entry.isFile()) result.push(fullPath)
  }
  return result
}

async function extractFramework(apktoolJar, destination) {
  const archive = await JSZip.loadAsync(await readFile(apktoolJar))
  const framework = archive.file('brut/androlib/android-framework.jar')
  if (!framework) throw new Error('Le framework Android embarqué dans apktool-jar est introuvable.')
  await writeFile(destination, await framework.async('nodebuffer'))
}

async function getSigningMaterial() {
  const signingDir = resolve(process.env.LIFEOS_ANDROID_SIGNING_DIR || join(root, '.android-signing'))
  const privateKey = resolve(process.env.LIFEOS_ANDROID_PRIVATE_KEY || join(signingDir, 'lifeos-release-key.pem'))
  const certificate = resolve(process.env.LIFEOS_ANDROID_CERTIFICATE || join(signingDir, 'lifeos-release-certificate.pem'))
  const customMaterial = Boolean(process.env.LIFEOS_ANDROID_PRIVATE_KEY || process.env.LIFEOS_ANDROID_CERTIFICATE)

  if (!existsSync(privateKey) || !existsSync(certificate)) {
    if (customMaterial) {
      throw new Error('La clé privée ou le certificat indiqué pour la signature Android est introuvable.')
    }
    if (existsSync(releaseCertificate)) {
      throw new Error([
        'La clé privée de publication Android est absente.',
        `Restaurez-la dans ${relative(root, privateKey)} ou définissez LIFEOS_ANDROID_PRIVATE_KEY et LIFEOS_ANDROID_CERTIFICATE.`,
        "Une nouvelle clé n'est pas générée automatiquement afin de préserver la possibilité de mettre l'application à jour.",
      ].join(' '))
    }
    log('Génération de la clé de publication locale (elle ne sera jamais ajoutée à Git)…')
    await mkdir(signingDir, { recursive: true, mode: 0o700 })
    await run('openssl', ['genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:4096', '-out', privateKey])
    await run('openssl', [
      'req', '-new', '-x509', '-sha256', '-days', '7300',
      '-key', privateKey,
      '-out', certificate,
      '-subj', '/C=MA/O=LifeOS/OU=Android/CN=LifeOS',
    ])
  }

  const [privateKeyPem, certificatePem] = await Promise.all([
    readFile(privateKey, 'utf8'),
    readFile(certificate, 'utf8'),
  ])

  if (existsSync(releaseCertificate)) {
    const expected = await certificateDerSha256(await readFile(releaseCertificate, 'utf8'))
    const actual = await certificateDerSha256(certificatePem)
    if (expected !== actual) {
      throw new Error('Le certificat fourni ne correspond pas au certificat de publication Android enregistré dans le dépôt.')
    }
  } else {
    await copyFile(certificate, releaseCertificate)
    log(`Certificat public enregistré dans ${relative(root, releaseCertificate)}.`)
  }

  return { privateKeyPem, certificatePem }
}

async function certificateDerSha256(pem) {
  const body = pem.replace(/-----(BEGIN|END) CERTIFICATE-----|\s/g, '')
  return createHash('sha256').update(Buffer.from(body, 'base64')).digest('hex')
}

async function fileSha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex')
}

async function requireTrustedHash(file, expected, label) {
  const actual = await fileSha256(file)
  if (actual !== expected) throw new Error(`${label} ne correspond pas à l’artefact de confiance attendu (${actual}).`)
}

async function createUnsignedApk(resourcesApk, nitronBaseApk, destination) {
  const [apk, nitron] = await Promise.all([
    JSZip.loadAsync(await readFile(resourcesApk)),
    JSZip.loadAsync(await readFile(nitronBaseApk)),
  ])
  const dex = nitron.file('classes.dex')
  if (!dex) throw new Error('Le runtime Android Nitron ne contient pas classes.dex.')
  apk.file('classes.dex', await dex.async('uint8array'), { binary: true, compression: 'DEFLATE' })

  const webFiles = await listFiles(distDir)
  let embeddedCount = 0
  for (const file of webFiles) {
    const webPath = relative(distDir, file).replaceAll('\\', '/')
    // Download artifacts belong to the website, never recursively inside the app.
    if (/^downloads\//i.test(webPath)) continue
    apk.file(`assets/www/${webPath}`, await readFile(file), { binary: true, compression: 'DEFLATE' })
    embeddedCount += 1
  }
  apk.file('assets/licenses/NITRON-LICENSE.txt', await readFile(join(androidDir, 'runtime', 'NITRON-LICENSE.txt')), {
    binary: true,
    compression: 'DEFLATE',
  })

  const unsigned = await apk.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
    platform: 'UNIX',
  })
  await writeFile(destination, unsigned)
  return { unsigned, embeddedCount }
}

async function main() {
  if (!existsSync(join(distDir, 'index.html'))) {
    throw new Error("Le build web dist/ est absent. Exécutez d'abord npm run build.")
  }

  const aapt = require('aaptjs3').getBinPath()
  const Apktool = require('apktool-jar')
  const nitronBaseApk = join(androidDir, 'runtime', 'nitron-base.apk')
  for (const dependency of [aapt, Apktool.path, nitronBaseApk]) {
    if (!existsSync(dependency)) throw new Error(`Dépendance Android introuvable : ${dependency}`)
  }
  await Promise.all([
    requireTrustedHash(aapt, TRUSTED_TOOL_HASHES.aapt, 'AAPT2'),
    requireTrustedHash(nitronBaseApk, TRUSTED_TOOL_HASHES.runtime, 'Le runtime Nitron'),
  ])

  const workspace = await mkdtemp(join(tmpdir(), 'lifeos-android-'))
  try {
    const framework = join(workspace, 'android-framework.jar')
    const compiledResources = join(workspace, 'compiled-resources.zip')
    const resourcesApk = join(workspace, 'resources.apk')
    const unsignedApk = join(workspace, 'lifeos-unsigned.apk')

    log('Extraction du framework Android et compilation des ressources…')
    await extractFramework(Apktool.path, framework)
    await requireTrustedHash(framework, TRUSTED_TOOL_HASHES.framework, 'Le framework Android')
    await run(aapt, ['compile', '--dir', join(androidDir, 'res'), '-o', compiledResources])
    await run(aapt, [
      'link', '-o', resourcesApk,
      '-I', framework,
      '--manifest', join(androidDir, 'AndroidManifest.xml'),
      '--min-sdk-version', '21',
      '--target-sdk-version', '34',
      '--version-code', String(versionCode),
      '--version-name', versionName,
      compiledResources,
    ])

    log('Intégration du build React dans le runtime Android hors connexion…')
    const { unsigned, embeddedCount } = await createUnsignedApk(resourcesApk, nitronBaseApk, unsignedApk)
    const { privateKeyPem, certificatePem } = await getSigningMaterial()

    log('Alignement ZIP et signature APK v1 + v2 + v3…')
    const { signedApk, signatureSize } = await signApk(unsigned, privateKeyPem, certificatePem)
    await mkdir(publicDownloads, { recursive: true })
    await writeFile(outputApk, signedApk)

    log('Vérification indépendante du manifeste, des fichiers et des signatures…')
    const verification = await verifyAndroidApk(outputApk, {
      expectedCertificate: releaseCertificate,
      aapt,
      expectedPackage: packageName,
    })

    const apkSha256 = createHash('sha256').update(signedApk).digest('hex')
    const apkStats = await stat(outputApk)
    const certificateSha256 = await certificateDerSha256(certificatePem)
    const metadata = {
      application: 'LifeOS',
      packageName,
      versionName,
      versionCode,
      minSdkVersion: 21,
      targetSdkVersion: 34,
      filename: apkFilename,
      mediaType: 'application/vnd.android.package-archive',
      sizeBytes: apkStats.size,
      sha256: apkSha256,
      signingCertificateSha256: certificateSha256,
      signatureSchemes: verification.signatureSchemes,
      embeddedWebFiles: embeddedCount,
      generatedAt: new Date().toISOString(),
    }
    const metadataJson = `${JSON.stringify(metadata, null, 2)}\n`
    await writeFile(join(publicDownloads, metadataFilename), metadataJson)

    // npm run build:android leaves both the downloadable site build and public/ ready.
    await mkdir(distDownloads, { recursive: true })
    await Promise.all([
      copyFile(outputApk, join(distDownloads, apkFilename)),
      writeFile(join(distDownloads, metadataFilename), metadataJson),
    ])

    log(`APK prête : ${relative(root, outputApk)} (${(apkStats.size / 1024 / 1024).toFixed(2)} Mio)`)
    log(`SHA-256 APK : ${apkSha256}`)
    log(`SHA-256 certificat : ${certificateSha256}`)
    log(`Signatures : ${verification.signatureSchemes.join(', ')} · bloc ${signatureSize} octets`)
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
}

main().catch(error => {
  console.error(`\nÉchec du build Android : ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
